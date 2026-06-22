using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using ERP_API.Dtos;
using ERP_API.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ERP_API.Controllers;

/// <summary>
/// Authentication endpoints. Login is anonymous; everything else in the API
/// requires the bearer token issued here. There is no registration endpoint —
/// the single login is seeded from configuration on startup.
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _service;

    public AuthController(IAuthService service) => _service = service;

    /// <summary>POST /api/auth/login — validate credentials, return a signed JWT.</summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await _service.LoginAsync(request);
        return result is null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(result);
    }

    /// <summary>GET /api/auth/me — the current user, resolved from the bearer token.</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUser>> Me()
    {
        var email = User.Identity?.Name
            ?? User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(JwtRegisteredClaimNames.Email);

        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var user = await _service.GetByEmailAsync(email);
        return user is null ? Unauthorized() : Ok(user);
    }
}
