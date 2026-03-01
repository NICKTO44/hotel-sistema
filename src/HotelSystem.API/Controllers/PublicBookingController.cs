using HotelSystem.Application.Features.Reservations.Commands.CreateReservation;
using HotelSystem.Application.Features.Rooms.Queries.GetAvailableRooms;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HotelSystem.API.Controllers
{
    [AllowAnonymous]
    [Route("api/public")]
    [ApiController]
    public class PublicBookingController : ControllerBase
    {
        private readonly IMediator _mediator;

        public PublicBookingController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("rooms")]
        public async Task<IActionResult> GetAvailableRooms(
            [FromQuery] DateTime checkIn,
            [FromQuery] DateTime checkOut)
        {
            if (checkIn >= checkOut)
                return BadRequest(new { message = "La fecha de salida debe ser posterior a la de entrada." });

            if (checkIn < DateTime.Today)
                return BadRequest(new { message = "La fecha de entrada no puede ser en el pasado." });

            var rooms = await _mediator.Send(new GetAvailableRoomsQuery
            {
                CheckIn = checkIn,
                CheckOut = checkOut
            });

            return Ok(rooms);
        }

        [HttpPost("booking")]
        public async Task<IActionResult> CreateBooking([FromBody] CreateReservationCommand command)
        {
            try
            {
                var result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
