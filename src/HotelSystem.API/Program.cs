using HotelSystem.Application;
using HotelSystem.Infrastructure;
using HotelSystem.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// ── CRÍTICA #2: Validar JWT Key al arrancar ───────────────────────────────
var jwtKey = builder.Configuration["JwtSettings:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || (jwtKey.StartsWith("DEV_ONLY") && !builder.Environment.IsDevelopment()))
{
    throw new InvalidOperationException(
        "JwtSettings:Key no está configurada para producción. " +
        "Define la variable de entorno JwtSettings__Key con una clave de 64+ caracteres.");
}

// ── CRÍTICA #1: Validar token de MP al arrancar ───────────────────────────
var mpToken = builder.Configuration["MercadoPago:AccessToken"];
if (string.IsNullOrWhiteSpace(mpToken) && !builder.Environment.IsDevelopment())
{
    throw new InvalidOperationException(
        "MercadoPago:AccessToken no está configurado. " +
        "Define la variable de entorno MercadoPago__AccessToken.");
}

builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration, builder.Environment);


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddSignalR();

var app = builder.Build();

// ── Seed Database solo en Development ────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    try
    {
        await DbInitializer.SeedAsync(scope.ServiceProvider);
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Error al hacer seed de la base de datos.");
    }
}

// ── CRÍTICA #3: HTTPS en producción ──────────────────────────────────────
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
    app.UseHsts();
}

// ── Headers de seguridad HTTP ─────────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Remove("Server");
    context.Response.Headers.Remove("X-Powered-By");
    await next();
});

app.UseMiddleware<HotelSystem.API.Middleware.ExceptionMiddleware>();

// ── ALTA #5: CORS restringido por entorno ────────────────────────────────
if (app.Environment.IsDevelopment())
{
    // Leer orígenes permitidos desde config — incluye ngrok si está definido
    var corsOrigins = builder.Configuration["CorsOrigins"]?.Split(",", StringSplitOptions.RemoveEmptyEntries)
        ?? new[] { "http://localhost:5173" };

    app.UseCors(policy => policy
        .WithOrigins(corsOrigins)
        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        .WithHeaders("Content-Type", "Authorization", "X-Requested-With", "ngrok-skip-browser-warning")
        .AllowCredentials());
}
else
{
    // Producción: solo dominio real en HTTPS
    var frontendUrl = builder.Configuration["App:FrontendUrl"]
        ?? throw new InvalidOperationException("App:FrontendUrl no configurado para producción.");

    app.UseCors(policy => policy
        .WithOrigins(frontendUrl)
        .WithMethods("GET", "POST", "PUT", "DELETE", "PATCH")
        .WithHeaders("Content-Type", "Authorization")
        .AllowCredentials());
}

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<HotelSystem.API.Hubs.NotificationHub>("/hubs/notifications");

app.Run();