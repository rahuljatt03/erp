namespace ERP_API.Auth;

/// <summary>
/// Strongly-typed JWT options, bound from the "Jwt" section of appsettings.json.
/// Shared by Program.cs (token validation parameters) and AuthService (token
/// issuance) so the issuer/audience/key are configured in exactly one place.
/// </summary>
public class JwtSettings
{
    public string Issuer { get; set; } = default!;
    public string Audience { get; set; } = default!;
    public string Key { get; set; } = default!;     // HMAC-SHA256 signing key (>= 32 bytes)
    public int ExpiryMinutes { get; set; } = 480;    // token lifetime
}
