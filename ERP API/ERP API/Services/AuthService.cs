using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ERP_API.Auth;
using ERP_API.Data;
using ERP_API.Dtos;
using ERP_API.Interfaces;
using ERP_API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ERP_API.Services;

/// <summary>
/// EF Core-backed authentication. Hashes passwords with PBKDF2 (no extra
/// dependency), validates logins, issues signed JWTs, and seeds the single
/// configured credential on startup.
/// </summary>
public class AuthService : IAuthService
{
    private readonly ErpDbContext _db;
    private readonly JwtSettings _jwt;

    public AuthService(ErpDbContext db, JwtSettings jwt)
    {
        _db = db;
        _jwt = jwt;
    }

    // --- PBKDF2 parameters ---------------------------------------------------
    private const int SaltSize = 16;        // 128-bit salt
    private const int KeySize = 32;         // 256-bit derived key
    private const int Iterations = 100_000;
    private static readonly HashAlgorithmName Algo = HashAlgorithmName.SHA256;

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var email = (request.Email ?? string.Empty).Trim();
        if (email.Length == 0) return null;

        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        if (user is null) return null;

        if (!VerifyPassword(request.Password ?? string.Empty, user.PasswordHash, user.PasswordSalt))
            return null;

        var (token, expires) = GenerateToken(user);
        return new AuthResponse
        {
            Token = token,
            ExpiresAt = expires.ToString("o"),
            User = ToAuthUser(user),
        };
    }

    public async Task<AuthUser?> GetByEmailAsync(string email)
    {
        email = (email ?? string.Empty).Trim();
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
        return user is null ? null : ToAuthUser(user);
    }

    // --- Helpers -------------------------------------------------------------

    private static AuthUser ToAuthUser(User u) => new()
    {
        Id = u.Id,
        Email = u.Email,
        DisplayName = u.DisplayName,
        Role = u.Role,
    };

    private static (string hash, string salt) HashPassword(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algo, KeySize);
        return (Convert.ToBase64String(hash), Convert.ToBase64String(salt));
    }

    private static bool VerifyPassword(string password, string hashB64, string saltB64)
    {
        try
        {
            var salt = Convert.FromBase64String(saltB64);
            var expected = Convert.FromBase64String(hashB64);
            var actual = Rfc2898DeriveBytes.Pbkdf2(password, salt, Iterations, Algo, KeySize);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            // Corrupt stored hash/salt — treat as a failed match rather than throwing.
            return false;
        }
    }

    private (string token, DateTime expires) GenerateToken(User user)
    {
        var expires = DateTime.UtcNow.AddMinutes(_jwt.ExpiryMinutes);
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim("displayName", user.DisplayName),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: credentials);

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
