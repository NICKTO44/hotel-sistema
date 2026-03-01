using HotelSystem.Application.Interfaces;
using HotelSystem.Domain.Entities;
using HotelSystem.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace HotelSystem.Infrastructure.Services
{
    public class AuditService : IAuditService
    {
        private readonly HotelDbContext _context;
        private readonly ILogger<AuditService> _logger;

        // ── Campos sensibles que NUNCA deben quedar en los logs de auditoría ──
        private static readonly HashSet<string> _sensitiveFields = new(StringComparer.OrdinalIgnoreCase)
        {
            "password", "passwordHash", "token", "accessToken", "refreshToken",
            "creditCard", "cardNumber", "cvv", "cvc", "pin",
            "identificationNumber", "dni", "passport",  // PII — enmascarar parcialmente
        };

        public AuditService(HotelDbContext context, ILogger<AuditService> logger)
        {
            _context = context;
            _logger  = logger;
        }

        public async Task LogAction(
            string  userId,
            string  userName,
            string  action,
            string  entityType,
            string  entityId,
            string? oldValues  = null,
            string? newValues  = null,
            string  ipAddress  = "")
        {
            try
            {
                // ── Sanitizar valores antes de guardarlos en auditoría ────────
                var sanitizedOld = SanitizeSensitiveFields(oldValues);
                var sanitizedNew = SanitizeSensitiveFields(newValues);

                // ── Truncar campos para evitar DoS por valores enormes ────────
                var auditLog = new AuditLog
                {
                    Id         = Guid.NewGuid(),
                    UserId     = Truncate(userId,    128),
                    UserName   = Truncate(userName,  128),
                    Action     = Truncate(action,    64),
                    EntityType = Truncate(entityType,64),
                    EntityId   = Truncate(entityId,  128),
                    OldValues  = Truncate(sanitizedOld, 4000),
                    NewValues  = Truncate(sanitizedNew, 4000),
                    Timestamp  = DateTime.UtcNow,
                    IpAddress  = Truncate(MaskIpAddress(ipAddress), 45),
                };

                _context.AuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // ── Error en auditoría NO debe romper el flujo principal ──────
                // Solo loguear el error, nunca propagarlo
                _logger.LogError("Error al escribir log de auditoría: {Type}", ex.GetType().Name);
            }
        }

        // ── Límite razonable por defecto: 100 registros ───────────────────────
        public async Task<List<AuditLog>> GetAllLogs(int limit = 100)
        {
            // ── Limitar máximo para evitar queries que devuelvan millones de filas ──
            limit = Math.Clamp(limit, 1, 500);

            return await _context.AuditLogs
                .AsNoTracking()                          // Solo lectura — mejor rendimiento
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        public async Task<List<AuditLog>> GetLogsByUser(string userId, int limit = 50)
        {
            if (string.IsNullOrWhiteSpace(userId))
                return new List<AuditLog>();

            limit = Math.Clamp(limit, 1, 200);

            return await _context.AuditLogs
                .AsNoTracking()
                .Where(a => a.UserId == userId)
                .OrderByDescending(a => a.Timestamp)
                .Take(limit)
                .ToListAsync();
        }

        // ── NUEVA: Consulta paginada para el panel de administración ──────────
        public async Task<(List<AuditLog> Items, int Total)> GetLogsPaged(
            int    page       = 1,
            int    pageSize   = 50,
            string? userId    = null,
            string? action    = null,
            DateTime? from    = null,
            DateTime? to      = null)
        {
            page     = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 100);

            var query = _context.AuditLogs.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(userId))
                query = query.Where(a => a.UserId == userId);

            if (!string.IsNullOrWhiteSpace(action))
                query = query.Where(a => a.Action == action);

            if (from.HasValue)
                query = query.Where(a => a.Timestamp >= from.Value);

            if (to.HasValue)
                query = query.Where(a => a.Timestamp <= to.Value);

            var total = await query.CountAsync();
            var items = await query
                .OrderByDescending(a => a.Timestamp)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return (items, total);
        }

        // ── Helpers privados ──────────────────────────────────────────────────

        /// <summary>
        /// Detecta campos sensibles en el JSON y los reemplaza por "***".
        /// Si el valor no es JSON, lo devuelve tal cual.
        /// </summary>
        private static string? SanitizeSensitiveFields(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return json;

            try
            {
                using var doc = JsonDocument.Parse(json);
                var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);
                if (dict == null) return json;

                var sanitized = new Dictionary<string, object?>();
                foreach (var kv in dict)
                {
                    if (_sensitiveFields.Contains(kv.Key))
                        sanitized[kv.Key] = "***";
                    else if (kv.Key.Equals("identificationNumber", StringComparison.OrdinalIgnoreCase) ||
                             kv.Key.Equals("dni", StringComparison.OrdinalIgnoreCase))
                        // Enmascarar parcialmente: mostrar últimos 4 dígitos
                        sanitized[kv.Key] = MaskId(kv.Value.ToString());
                    else
                        sanitized[kv.Key] = kv.Value.ToString();
                }

                return JsonSerializer.Serialize(sanitized);
            }
            catch
            {
                // Si no es JSON válido, devolver sin modificar
                return json;
            }
        }

        /// <summary>Muestra solo los últimos 4 caracteres: ****1234</summary>
        private static string MaskId(string? value)
        {
            if (string.IsNullOrWhiteSpace(value) || value.Length <= 4)
                return "****";
            return $"****{value[^4..]}";
        }

        /// <summary>
        /// Anonimiza la IP para cumplir con privacidad:
        /// IPv4: 192.168.1.100 → 192.168.1.0
        /// IPv6: 2001:db8::1   → 2001:db8::0
        /// </summary>
        private static string MaskIpAddress(string? ip)
        {
            if (string.IsNullOrWhiteSpace(ip)) return "";

            // IPv4
            var ipv4 = Regex.Match(ip, @"^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.\d{1,3}$");
            if (ipv4.Success)
                return $"{ipv4.Groups[1].Value}.{ipv4.Groups[2].Value}.{ipv4.Groups[3].Value}.0";

            // IPv6 — truncar al primer segmento significativo
            if (ip.Contains(":"))
            {
                var parts = ip.Split(":");
                return parts.Length >= 2 ? $"{parts[0]}:{parts[1]}::0" : ip;
            }

            return ip;
        }

        private static string? Truncate(string? value, int maxLength) =>
            value?.Length > maxLength ? value[..maxLength] : value;
    }
}