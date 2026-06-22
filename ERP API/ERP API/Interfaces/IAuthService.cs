using ERP_API.Dtos;

namespace ERP_API.Interfaces;

/// <summary>
/// Authentication operations: turning a valid login into a signed JWT, resolving
/// the current user for /me, and seeding the single configured credential on
/// startup. The controller depends on this, not on the DbContext or JWT plumbing.
/// </summary>
public interface IAuthService
{
    /// <summary>Validate credentials; returns a JWT + user on success, null on bad credentials.</summary>
    Task<AuthResponse?> LoginAsync(LoginRequest request);

    /// <summary>Resolve the public profile for an authenticated email (used by /me).</summary>
    Task<AuthUser?> GetByEmailAsync(string email);
}
