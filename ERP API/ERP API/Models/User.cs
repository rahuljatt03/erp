namespace ERP_API.Models;

/// <summary>
/// Application user. The system has no self-registration — logins live in the
/// database and are validated at POST /api/auth/login. Passwords are never stored
/// in clear text: we keep a PBKDF2 hash plus a per-user salt (see AuthService).
/// </summary>
public class User
{
    public int Id { get; set; }                          // auto-increment PK
    public string Email { get; set; } = default!;        // unique login (email address)
    public string DisplayName { get; set; } = default!;  // shown in the topbar
    public string Role { get; set; } = "admin";          // coarse role claim
    public string PasswordHash { get; set; } = default!; // base64 PBKDF2 hash
    public string PasswordSalt { get; set; } = default!; // base64 per-user salt
    public string CreatedAt { get; set; } = default!;    // ISO datetime (UTC)
}
