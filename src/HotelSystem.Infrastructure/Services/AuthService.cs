using HotelSystem.Application.DTOs;
using HotelSystem.Application.Interfaces;
using HotelSystem.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace HotelSystem.Infrastructure.Services
{
    public class AuthService : IAuthService
    {
        private readonly UserManager<ApplicationUser>  _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<ApplicationUser>  userManager,
            SignInManager<ApplicationUser> signInManager,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userManager   = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger        = logger;
        }

        public async Task<AuthResponse> Login(AuthRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
                throw new UnauthorizedAccessException("Credenciales inválidas.");

            var user = await _userManager.FindByEmailAsync(request.Email.Trim().ToLower());

            if (user == null)
            {
                _logger.LogWarning("Intento de login con email no registrado.");
                throw new UnauthorizedAccessException("Credenciales inválidas.");
            }

            if (await _userManager.IsLockedOutAsync(user))
            {
                _logger.LogWarning("Login bloqueado para usuario {UserId} por demasiados intentos.", user.Id);
                throw new UnauthorizedAccessException("Cuenta temporalmente bloqueada. Intenta en unos minutos.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (!result.Succeeded)
            {
                if (result.IsLockedOut)
                {
                    _logger.LogWarning("Cuenta bloqueada tras intentos fallidos. UserId: {UserId}", user.Id);
                    throw new UnauthorizedAccessException("Cuenta temporalmente bloqueada. Intenta en unos minutos.");
                }

                _logger.LogWarning("Login fallido para UserId: {UserId}", user.Id);
                throw new UnauthorizedAccessException("Credenciales inválidas.");
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role  = roles.FirstOrDefault() ?? "Staff";

            var token = GenerateToken(user, role);

            _logger.LogInformation("Login exitoso. UserId: {UserId}, Role: {Role}", user.Id, role);

            return new AuthResponse
            {
                Id       = user.Id,
                UserName = user.UserName,
                Email    = user.Email,
                Role     = role,
                Token    = token
            };
        }

        public async Task ChangePassword(string userId, string currentPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 8)
                throw new ArgumentException("La nueva contraseña debe tener al menos 8 caracteres.");

            if (newPassword == currentPassword)
                throw new ArgumentException("La nueva contraseña debe ser diferente a la actual.");

            // ── CORREGIDO: buscar por ID primero, si no por email ─────────────
            // El claim NameIdentifier puede venir como GUID o como email según
            // la configuración del proyecto, así que intentamos ambos
            var user = await _userManager.FindByIdAsync(userId)
                    ?? await _userManager.FindByEmailAsync(userId);

            if (user == null)
            {
                _logger.LogWarning("ChangePassword: usuario no encontrado para '{UserId}'", userId);
                throw new UnauthorizedAccessException("Operación no permitida.");
            }

            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                _logger.LogWarning("ChangePassword fallido para UserId {UserId}: {Errors}", user.Id, errors);
                throw new InvalidOperationException("No se pudo cambiar la contraseña. Verifica que la actual sea correcta.");
            }

            _logger.LogInformation("Contraseña cambiada exitosamente. UserId: {UserId}", user.Id);
        }

        private string GenerateToken(ApplicationUser user, string role)
        {
            var rawKey = _configuration["JwtSettings:Key"];
            if (string.IsNullOrWhiteSpace(rawKey))
                throw new InvalidOperationException(
                    "JwtSettings:Key no está configurada. Define la variable de entorno JwtSettings__Key.");

            if (Encoding.UTF8.GetByteCount(rawKey) < 32)
                throw new InvalidOperationException(
                    "JwtSettings:Key es demasiado corta. Debe tener al menos 32 caracteres.");

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Email     ?? string.Empty),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat,
                    DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64),
                new Claim(ClaimTypes.NameIdentifier, user.Id       ?? string.Empty),
                new Claim(ClaimTypes.Name,           user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Role,           role),
            };

            var key   = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(rawKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            if (!double.TryParse(_configuration["JwtSettings:DurationInMinutes"], out var durationMinutes))
                durationMinutes = 60;

            durationMinutes = Math.Min(durationMinutes, 480);

            var token = new JwtSecurityToken(
                issuer:             _configuration["JwtSettings:Issuer"],
                audience:           _configuration["JwtSettings:Audience"],
                claims:             claims,
                notBefore:          DateTime.UtcNow,
                expires:            DateTime.UtcNow.AddMinutes(durationMinutes),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}