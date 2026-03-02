using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using MercadoPago.Config;
using MercadoPago.Client.Preference;
using MercadoPago.Client.Payment;
using MercadoPago.Resource.Preference;
using HotelSystem.Application.Features.Reservations.Commands.CreateReservation;
using HotelSystem.Application.DTOs;
using MediatR;
using System.Security.Cryptography;
using System.Text;

namespace HotelSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly IMediator _mediator;
        private readonly ILogger<PaymentController> _logger;

        public PaymentController(IConfiguration configuration, IMediator mediator, ILogger<PaymentController> logger)
        {
            _configuration = configuration;
            _mediator = mediator;
            _logger = logger;
        }

        private string GetAccessToken()
        {
            var token = _configuration["MercadoPago:AccessToken"];
            if (string.IsNullOrWhiteSpace(token))
                throw new InvalidOperationException(
                    "MercadoPago AccessToken no está configurado. " +
                    "Define la variable de entorno MercadoPago__AccessToken.");
            return token;
        }

        [HttpPost("create-preference")]
        public async Task<IActionResult> CreatePreference([FromBody] CreatePreferenceRequest request)
        {
            if (request == null)
                return BadRequest(new { message = "Datos de solicitud inválidos." });

            if (!Guid.TryParse(request.RoomId, out _))
                return BadRequest(new { message = "RoomId inválido." });

            if (request.TotalPrice <= 0)
                return BadRequest(new { message = "El precio total debe ser mayor a cero." });

            if (string.IsNullOrWhiteSpace(request.GuestEmail) || !request.GuestEmail.Contains("@"))
                return BadRequest(new { message = "Email del huésped inválido." });

            try
            {
                MercadoPagoConfig.AccessToken = GetAccessToken();

                var frontendUrl = _configuration["App:FrontendUrl"]
                    ?? throw new InvalidOperationException("App:FrontendUrl no configurado.");

                // ── DEBUG TEMPORAL: verificar que la URL se lee correctamente ──
                _logger.LogInformation("FrontendUrl configurada: {Url}", frontendUrl);
                _logger.LogInformation("BackUrl Success será: {Url}", $"{frontendUrl}/booking?payment=success");

                var client = new PreferenceClient();

                var preference = new PreferenceRequest
                {
                    Items = new List<PreferenceItemRequest>
                    {
                        new PreferenceItemRequest
                        {
                            Id          = request.RoomId,
                            Title       = $"Habitación {request.RoomNumber} - {request.RoomTypeName}",
                            Description = $"Check-in: {request.CheckIn} | Check-out: {request.CheckOut} | {request.Nights} noche(s)",
                            Quantity    = 1,
                            CurrencyId  = "PEN",
                            UnitPrice   = request.TotalPrice,
                        }
                    },
                    Payer = new PreferencePayerRequest
                    {
                        Name    = request.GuestFirstName,
                        Surname = request.GuestLastName,
                        Email   = request.GuestEmail,
                    },
                    BackUrls = new PreferenceBackUrlsRequest
                    {
                        Success = $"{frontendUrl}/booking?payment=success",
                        Failure = $"{frontendUrl}/booking?payment=failure",
                        Pending = $"{frontendUrl}/booking?payment=pending",
                    },
                    AutoReturn = "approved",
                    Metadata = new Dictionary<string, object>
                    {
                        ["room_id"]           = request.RoomId,
                        ["check_in"]          = request.CheckIn,
                        ["check_out"]         = request.CheckOut,
                        ["guest_first_name"]  = request.GuestFirstName,
                        ["guest_last_name"]   = request.GuestLastName,
                        ["guest_email"]       = request.GuestEmail,
                        ["guest_phone"]       = request.GuestPhone,
                        ["guest_id_number"]   = request.GuestIdNumber,
                        ["guest_nationality"] = request.GuestNationality,
                        ["notes"]             = request.Notes ?? "",
                        ["total_price"]       = request.TotalPrice,
                    },
                    Expires             = true,
                    ExpirationDateTo    = DateTime.UtcNow.AddMinutes(30),
                    StatementDescriptor = "HOTEL SISTEMA",
                    ExternalReference   = $"HOTEL-{request.RoomId}-{DateTime.UtcNow.Ticks}",
                };

                Preference result = await client.CreateAsync(preference);

                _logger.LogInformation("Preferencia MP creada. ExternalRef: {Ref}", preference.ExternalReference);

                return Ok(new
                {
                    preferenceId     = result.Id,
                    initPoint        = result.InitPoint,
                    sandboxInitPoint = result.SandboxInitPoint,
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError("Configuración inválida: {Message}", ex.Message);
                return StatusCode(500, new { message = "Error de configuración del servidor." });
            }
            catch (Exception ex)
            {
                _logger.LogError("Error MP — Tipo: {Type} | Mensaje: {Message} | Inner: {Inner}",
                    ex.GetType().Name,
                    ex.Message,
                    ex.InnerException?.Message ?? "ninguno");

                return BadRequest(new { message = "Error al procesar el pago. Intenta nuevamente." });
            }
        }


        [HttpPost("confirm-by-preference")]
        [AllowAnonymous]
        public async Task<IActionResult> ConfirmByPreference([FromBody] ConfirmByPreferenceRequest request)
        {
            try
            {
                MercadoPagoConfig.AccessToken = GetAccessToken();
                var client = new PreferenceClient();
                var preference = await client.GetAsync(request.PreferenceId);

                if (preference == null)
                    return BadRequest(new { message = "Preferencia no encontrada." });

                var meta = preference.Metadata;
                if (meta == null)
                    return BadRequest(new { message = "Metadata vacía." });

                string GetMeta(string key) =>
                    meta.ContainsKey(key) ? meta[key]?.ToString() ?? "" : "";

                var roomIdStr   = GetMeta("room_id");
                var checkInStr  = GetMeta("check_in");
                var checkOutStr = GetMeta("check_out");
                var firstName   = GetMeta("guest_first_name");
                var lastName    = GetMeta("guest_last_name");
                var email       = GetMeta("guest_email");
                var phone       = GetMeta("guest_phone");
                var idNumber    = GetMeta("guest_id_number");
                var nationality = GetMeta("guest_nationality");
                var notes       = GetMeta("notes");

                if (!Guid.TryParse(roomIdStr, out var roomId))
                    return BadRequest(new { message = "room_id inválido." });

                if (!DateTime.TryParse(checkInStr, out var checkIn) ||
                    !DateTime.TryParse(checkOutStr, out var checkOut))
                    return BadRequest(new { message = "Fechas inválidas." });

                var command = new CreateReservationCommand
                {
                    RoomId       = roomId,
                    CheckInDate  = checkIn,
                    CheckOutDate = checkOut,
                    Adults       = 1,
                    Children     = 0,
                    Notes        = notes,
                    Guest        = new GuestDto
                    {
                        FirstName            = firstName,
                        LastName             = lastName,
                        Email                = email,
                        Phone                = phone,
                        IdentificationNumber = idNumber,
                        Nationality          = nationality,
                    }
                };

                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError("Error confirmando por preferencia: {Message}", ex.Message);
                return BadRequest(new { message = "Error al confirmar reserva." });
            }
        }

        [HttpPost("webhook")]
        [AllowAnonymous]
        public async Task<IActionResult> Webhook([FromQuery] string? type, [FromQuery] string? data_id)
        {
            if (!await ValidateWebhookSignature())
            {
                _logger.LogWarning("Webhook rechazado: firma inválida. IP: {IP}",
                    HttpContext.Connection.RemoteIpAddress);
                return Ok();
            }

            try
            {
                _logger.LogInformation("Webhook MP recibido. type={Type}, id={Id}", type, data_id);

                if (type != "payment" || string.IsNullOrEmpty(data_id))
                    return Ok();

                if (!long.TryParse(data_id, out var paymentId))
                {
                    _logger.LogWarning("Webhook: data_id no es un número válido.");
                    return Ok();
                }

                MercadoPagoConfig.AccessToken = GetAccessToken();

                var paymentClient = new PaymentClient();
                var payment = await paymentClient.GetAsync(paymentId);

                _logger.LogInformation("Pago MP status: {Status}, id: {Id}", payment.Status, paymentId);

                if (payment.Status != "approved")
                    return Ok();

                var meta = payment.Metadata;
                if (meta == null)
                {
                    _logger.LogWarning("Webhook: metadata vacía para pago {Id}", paymentId);
                    return Ok();
                }

                string GetMeta(string key) =>
                    meta.ContainsKey(key) ? meta[key]?.ToString() ?? "" : "";

                var roomIdStr   = GetMeta("room_id");
                var checkInStr  = GetMeta("check_in");
                var checkOutStr = GetMeta("check_out");
                var firstName   = GetMeta("guest_first_name");
                var lastName    = GetMeta("guest_last_name");
                var email       = GetMeta("guest_email");
                var phone       = GetMeta("guest_phone");
                var idNumber    = GetMeta("guest_id_number");
                var nationality = GetMeta("guest_nationality");
                var notes       = GetMeta("notes");

                if (!Guid.TryParse(roomIdStr, out var roomId))
                {
                    _logger.LogError("Webhook: room_id inválido en metadata. PaymentId: {Id}", paymentId);
                    return Ok();
                }

                if (!DateTime.TryParse(checkInStr, out var checkIn) ||
                    !DateTime.TryParse(checkOutStr, out var checkOut))
                {
                    _logger.LogError("Webhook: fechas inválidas en metadata. PaymentId: {Id}", paymentId);
                    return Ok();
                }

                var command = new CreateReservationCommand
                {
                    RoomId       = roomId,
                    CheckInDate  = checkIn,
                    CheckOutDate = checkOut,
                    Adults       = 1,
                    Children     = 0,
                    Notes        = notes,
                    Guest        = new GuestDto
                    {
                        FirstName            = firstName,
                        LastName             = lastName,
                        Email                = email,
                        Phone                = phone,
                        IdentificationNumber = idNumber,
                        Nationality          = nationality,
                    }
                };

                await _mediator.Send(command);
                _logger.LogInformation("Reserva creada desde webhook. RoomId: {RoomId}", roomId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error en webhook. Tipo: {Type}", ex.GetType().Name);
                return Ok();
            }
        }

        private async Task<bool> ValidateWebhookSignature()
        {
            var webhookSecret = _configuration["MercadoPago:WebhookSecret"];

            if (string.IsNullOrWhiteSpace(webhookSecret))
            {
                _logger.LogWarning("MercadoPago:WebhookSecret no configurado. " +
                    "Validación de firma omitida. NO usar en producción.");
                return true;
            }

            var xSignature = Request.Headers["x-signature"].ToString();
            var xRequestId = Request.Headers["x-request-id"].ToString();

            if (string.IsNullOrEmpty(xSignature))
            {
                _logger.LogWarning("Webhook sin header x-signature.");
                return false;
            }

            string? ts = null;
            string? v1 = null;
            foreach (var part in xSignature.Split(","))
            {
                var kv = part.Trim().Split("=", 2);
                if (kv.Length == 2)
                {
                    if (kv[0] == "ts") ts = kv[1];
                    if (kv[0] == "v1") v1 = kv[1];
                }
            }

            if (string.IsNullOrEmpty(ts) || string.IsNullOrEmpty(v1))
            {
                _logger.LogWarning("Webhook: formato de x-signature inválido.");
                return false;
            }

            var dataId   = Request.Query["data_id"].ToString();
            var manifest = $"id:{dataId};request-id:{xRequestId};ts:{ts};";

            using var hmac        = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
            var hash              = hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();
            var isValid           = string.Equals(expectedSignature, v1, StringComparison.OrdinalIgnoreCase);

            if (!isValid)
                _logger.LogWarning("Webhook: firma no coincide. Posible petición falsificada.");

            return isValid;
        }
    }

    public class ConfirmByPreferenceRequest
{
    public string PreferenceId { get; set; } = "";
}

public class ConfirmByPreferenceRequest
{
    public string PreferenceId { get; set; } = "";
}

public class CreatePreferenceRequest
    {
        public string  RoomId           { get; set; } = "";
        public string  RoomNumber       { get; set; } = "";
        public string  RoomTypeName     { get; set; } = "";
        public string  CheckIn          { get; set; } = "";
        public string  CheckOut         { get; set; } = "";
        public int     Nights           { get; set; }
        public decimal TotalPrice       { get; set; }
        public string  GuestFirstName   { get; set; } = "";
        public string  GuestLastName    { get; set; } = "";
        public string  GuestEmail       { get; set; } = "";
        public string  GuestPhone       { get; set; } = "";
        public string  GuestIdNumber    { get; set; } = "";
        public string  GuestNationality { get; set; } = "";
        public string? Notes            { get; set; }
        public string  FrontendUrl      { get; set; } = "";
    }
}