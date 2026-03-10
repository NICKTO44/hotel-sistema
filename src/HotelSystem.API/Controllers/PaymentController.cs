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
using System.Text.Json;

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
        public async Task<IActionResult> Webhook()
        {
            // Leer body completo ANTES de cualquier otra operación
            Request.EnableBuffering();
            using var reader = new StreamReader(Request.Body, leaveOpen: true);
            var rawBody = await reader.ReadToEndAsync();
            Request.Body.Position = 0;

            // MP envía data.id con PUNTO en query params, no guión bajo
            // Ejemplo URL: /webhook?data.id=123456&type=payment
            var dataId = Request.Query["data.id"].ToString();
            var type   = Request.Query["type"].ToString();

            _logger.LogInformation("Webhook recibido. type={Type}, data.id={Id}, body={Body}",
                type, dataId, rawBody);

            // Validar firma con el data.id correcto (con punto)
            if (!ValidateWebhookSignature(dataId))
            {
                _logger.LogWarning("Webhook rechazado: firma inválida. IP: {IP}",
                    HttpContext.Connection.RemoteIpAddress);
                return Ok(); // Siempre 200 para que MP no reintente
            }

            try
            {
                if (type != "payment" || string.IsNullOrEmpty(dataId))
                {
                    _logger.LogInformation("Webhook ignorado. type={Type}, data.id={Id}", type, dataId);
                    return Ok();
                }

                if (!long.TryParse(dataId, out var paymentId))
                {
                    _logger.LogWarning("Webhook: data.id no es número válido: {Id}", dataId);
                    return Ok();
                }

                MercadoPagoConfig.AccessToken = GetAccessToken();

                var paymentClient = new PaymentClient();
                var payment = await paymentClient.GetAsync(paymentId);

                _logger.LogInformation("Pago MP status: {Status}, id: {Id}", payment.Status, paymentId);

                if (payment.Status != "approved")
                {
                    _logger.LogInformation("Pago no aprobado. Status: {Status}", payment.Status);
                    return Ok();
                }

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

                _logger.LogInformation(
                    "Webhook metadata — room_id={RoomId}, checkIn={CheckIn}, checkOut={CheckOut}, email={Email}",
                    roomIdStr, checkInStr, checkOutStr, email);

                if (!Guid.TryParse(roomIdStr, out var roomId))
                {
                    _logger.LogError("Webhook: room_id inválido. PaymentId={Id}, room_id={RoomId}",
                        paymentId, roomIdStr);
                    return Ok();
                }

                if (!DateTime.TryParse(checkInStr, out var checkIn) ||
                    !DateTime.TryParse(checkOutStr, out var checkOut))
                {
                    _logger.LogError("Webhook: fechas inválidas. checkIn={CI}, checkOut={CO}",
                        checkInStr, checkOutStr);
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
                _logger.LogInformation("✅ Reserva creada desde webhook. RoomId={RoomId}, PaymentId={PaymentId}",
                    roomId, paymentId);

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError("Error en webhook. Tipo={Type}, Mensaje={Message}, Inner={Inner}",
                    ex.GetType().Name, ex.Message, ex.InnerException?.Message ?? "ninguno");
                return Ok();
            }
        }

        private bool ValidateWebhookSignature(string dataId)
        {
            var webhookSecret = _configuration["MercadoPago:WebhookSecret"];

            if (string.IsNullOrWhiteSpace(webhookSecret))
            {
                _logger.LogWarning("WebhookSecret no configurado — validación omitida.");
                return true;
            }

            var xSignature = Request.Headers["x-signature"].ToString();
            var xRequestId = Request.Headers["x-request-id"].ToString();

            if (string.IsNullOrEmpty(xSignature))
            {
                _logger.LogWarning("Webhook sin header x-signature.");
                return false;
            }

            // Extraer ts y v1 del header x-signature
            string? ts = null;
            string? v1 = null;
            foreach (var part in xSignature.Split(","))
            {
                var kv = part.Trim().Split("=", 2);
                if (kv.Length == 2)
                {
                    if (kv[0].Trim() == "ts") ts = kv[1].Trim();
                    if (kv[0].Trim() == "v1") v1 = kv[1].Trim();
                }
            }

            if (string.IsNullOrEmpty(ts) || string.IsNullOrEmpty(v1))
            {
                _logger.LogWarning("Webhook: formato x-signature inválido: {Sig}", xSignature);
                return false;
            }

            // Construir manifest según doc oficial MP:
            // - Si x-request-id está vacío, omitirlo del manifest
            // Formato: id:{data.id};request-id:{x-request-id};ts:{ts};
            string manifest;
            if (string.IsNullOrEmpty(xRequestId))
                manifest = $"id:{dataId};ts:{ts};";
            else
                manifest = $"id:{dataId};request-id:{xRequestId};ts:{ts};";

            _logger.LogInformation("Webhook manifest: {Manifest}", manifest);

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(manifest));
            var expectedSignature = BitConverter.ToString(hash).Replace("-", "").ToLower();

            var isValid = string.Equals(expectedSignature, v1, StringComparison.OrdinalIgnoreCase);

            if (!isValid)
                _logger.LogWarning(
                    "Webhook firma NO coincide. Expected={Expected}, Got={Got}, Manifest={Manifest}",
                    expectedSignature, v1, manifest);
            else
                _logger.LogInformation("Webhook firma válida ✅");

            return isValid;
        }
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