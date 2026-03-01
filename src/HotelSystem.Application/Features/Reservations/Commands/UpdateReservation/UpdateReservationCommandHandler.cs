using AutoMapper;
using HotelSystem.Application.Common.Exceptions;
using HotelSystem.Application.DTOs;
using HotelSystem.Domain.Entities;
using HotelSystem.Domain.Enums;
using HotelSystem.Domain.Interfaces;
using MediatR;

namespace HotelSystem.Application.Features.Reservations.Commands.UpdateReservation
{
    public class UpdateReservationCommandHandler : IRequestHandler<UpdateReservationCommand, ReservationDto>
    {
        private readonly IGenericRepository<Reservation> _reservationRepository;
        private readonly IGenericRepository<Room> _roomRepository;
        private readonly IMapper _mapper;

        public UpdateReservationCommandHandler(
            IGenericRepository<Reservation> reservationRepository,
            IGenericRepository<Room> roomRepository,
            IMapper mapper)
        {
            _reservationRepository = reservationRepository;
            _roomRepository = roomRepository;
            _mapper = mapper;
        }

        public async Task<ReservationDto> Handle(UpdateReservationCommand request, CancellationToken cancellationToken)
        {
            var reservation = await _reservationRepository.GetByIdAsync(request.Id);
            if (reservation == null)
                throw new NotFoundException(nameof(Reservation), request.Id);

            var room = await _roomRepository.GetByIdAsync(request.RoomId, "RoomType");
            if (room == null)
                throw new NotFoundException(nameof(Room), request.RoomId);

            // Verificar disponibilidad excluyendo la reserva actual
            var conflictingReservations = await _reservationRepository.GetAsync(r =>
                r.Id != request.Id &&
                r.RoomId == request.RoomId &&
                r.Status != ReservationStatus.Cancelled &&
                r.CheckInDate < request.CheckOutDate &&
                request.CheckInDate < r.CheckOutDate);

            if (conflictingReservations.Any())
                throw new BadRequestException("The room is not available for the selected dates.");

            // Actualizar propiedades
            reservation.GuestId = request.GuestId;
            reservation.RoomId = request.RoomId;
            reservation.CheckInDate = request.CheckInDate;
            reservation.CheckOutDate = request.CheckOutDate;
            reservation.Adults = request.Adults;
            reservation.Children = request.Children;
            reservation.Notes = request.Notes;

            // Recalcular precio
            if (room.RoomType != null)
            {
                var nights = (int)(request.CheckOutDate - request.CheckInDate).TotalDays;
                if (nights < 1) nights = 1;
                reservation.TotalPrice = room.RoomType.BasePrice * nights;
            }

            await _reservationRepository.UpdateAsync(reservation);

            return _mapper.Map<ReservationDto>(reservation);
        }
    }
}
