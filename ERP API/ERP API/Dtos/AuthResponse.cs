namespace ERP_API.Dtos;

/// <summary>
/// Returned on a successful login. The React app persists <see cref="Token"/> and
/// sends it as "Authorization: Bearer &lt;token&gt;" on every request; <see cref="User"/>
/// populates the UI (topbar name/role).
/// </summary>
public class AuthResponse
{
    public string Token { get; set; } = default!;
    public string ExpiresAt { get; set; } = default!;   // ISO datetime (UTC)
    public AuthUser User { get; set; } = default!;
}

/// <summary>Public user shape — deliberately excludes the password hash/salt.</summary>
public class AuthUser
{
    public int Id { get; set; }
    public string Email { get; set; } = default!;
    public string DisplayName { get; set; } = default!;
    public string Role { get; set; } = default!;
}
