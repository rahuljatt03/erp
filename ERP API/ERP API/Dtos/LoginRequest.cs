namespace ERP_API.Dtos;

/// <summary>Credentials posted to POST /api/auth/login.</summary>
public class LoginRequest
{
    public string Email { get; set; } = default!;
    public string Password { get; set; } = default!;
}
