using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Backend.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _config;

    public JwtTokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(User user)
    {
        var jwt = _config.GetSection("Jwt");
        var key = jwt.GetValue<string>("Key") ??
            throw new InvalidOperationException("Jwt:Key not configured");
        var issuer = jwt.GetValue<string>("Issuer");
        var audience = jwt.GetValue<string>("Audience");
        var minutes = jwt.GetValue<int?>("ExpiresMinutes") ?? 60;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username)
        };

        var creds = new SigningCredentials(new SymmetricSecurityKey
            (Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256);
            
        var token = new JwtSecurityToken(issuer: issuer, audience:
            audience, claims: claims, expires: DateTime.UtcNow.
            AddMinutes(minutes), signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
