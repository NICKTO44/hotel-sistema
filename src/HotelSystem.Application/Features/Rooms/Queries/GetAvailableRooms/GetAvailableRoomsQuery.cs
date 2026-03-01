using HotelSystem.Application.DTOs;
using HotelSystem.Domain.Entities;
using HotelSystem.Domain.Enums;
using HotelSystem.Domain.Interfaces;
using MediatR;

namespace HotelSystem.Application.Features.Rooms.Queries.GetAvailableRooms
{
    public class GetAvailableRoomsQuery : IRequest<List<RoomDto>>
    {
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
    }

    public class GetAvailableRoomsQueryHandler : IRequestHandler<GetAvailableRoomsQuery, List<RoomDto>>
    {
        private readonly IGenericRepository<Room> _roomRepository;
        private readonly IGenericRepository<Reservation> _reservationRepository;

        public GetAvailableRoomsQueryHandler(
            IGenericRepository<Room> roomRepository,
            IGenericRepository<Reservation> reservationRepository)
        {
            _roomRepository = roomRepository;
            _reservationRepository = reservationRepository;
        }

        public async Task<List<RoomDto>> Handle(GetAvailableRoomsQuery request, CancellationToken cancellationToken)
        {
            // ── Habitaciones ocupadas = reservas activas con CheckedIn (sin importar fechas)
            // O reservas que se solapan con el rango solicitado ────────────────
            var occupiedReservations = await _reservationRepository.GetAsync(r =>
                r.Status != ReservationStatus.Cancelled &&
                r.Status != ReservationStatus.CheckedOut &&
                (
                    // Huésped actualmente hospedado — habitación bloqueada hasta check-out real
                    r.Status == ReservationStatus.CheckedIn
                    ||
                    // Reservas confirmadas/pendientes que se solapan con el rango solicitado
                    (r.CheckInDate < request.CheckOut && request.CheckIn < r.CheckOutDate)
                ));

            var occupiedRoomIds = occupiedReservations.Select(r => r.RoomId).ToHashSet();

            // Todas las habitaciones activas con su tipo
            var allRooms = await _roomRepository.GetAllAsync("RoomType");

            var available = allRooms
                .Where(r => r.IsActive && !occupiedRoomIds.Contains(r.Id))
                .Select(r => new RoomDto
                {
                    Id            = r.Id,
                    Number        = r.Number,
                    Floor         = r.Floor,
                    Status        = r.Status,
                    IsActive      = r.IsActive,
                    RoomTypeId    = r.RoomTypeId,
                    RoomTypeName  = r.RoomType?.Name ?? string.Empty,
                    PricePerNight = r.RoomType?.BasePrice ?? 0,
                    Capacity      = r.RoomType?.Capacity ?? 0,
                })
                .ToList();

            return available;
        }
    }
}