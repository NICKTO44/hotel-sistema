using FluentValidation;
using HotelSystem.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

namespace HotelSystem.API.Middleware
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/json";

            var response = new
            {
                status = 500,
                message = "An unexpected error occurred.",
                errors = new List<string>()
            };

            switch (exception)
            {
                case NotFoundException notFound:
                    context.Response.StatusCode = (int)HttpStatusCode.NotFound;
                    response = new
                    {
                        status = 404,
                        message = notFound.Message,
                        errors = new List<string>()
                    };
                    break;

                case BadRequestException badRequest:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response = new
                    {
                        status = 400,
                        message = badRequest.Message,
                        errors = new List<string>()
                    };
                    break;

                case ValidationException validation:
                    context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                    response = new
                    {
                        status = 400,
                        message = "Validation failed.",
                        errors = validation.Errors.Select(e => e.ErrorMessage).ToList()
                    };
                    break;

                default:
                    context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    break;
            }

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            await context.Response.WriteAsync(json);
        }
    }
}
