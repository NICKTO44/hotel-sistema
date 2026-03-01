import { FaCheck, FaBed } from 'react-icons/fa';

interface Room {
    number: string;
    roomTypeName: string;
}

interface ConfirmationProps {
    confirmationId: string;
    guestName: string;
    email: string;
    room: Room;
    checkIn: string;
    checkOut: string;
    nightCount: number;
    total: number;
    onNewBooking: () => void;
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

const Confirmation = ({
    confirmationId, guestName, email, room,
    checkIn, checkOut, nightCount, total, onNewBooking
}: ConfirmationProps) => {
    return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-sm">

                {/* Ícono éxito */}
                <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCheck className="text-emerald-600 text-2xl" />
                </div>

                <h2 className="text-2xl font-bold text-neutral-900 mb-2">¡Reserva confirmada!</h2>
                <p className="text-neutral-500 text-sm mb-8">
                    Hemos enviado los detalles a <strong className="text-neutral-700">{email}</strong>
                </p>

                {/* Detalles */}
                <div className="bg-neutral-50 rounded-xl p-5 text-left space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">N° de reserva</span>
                        <span className="font-mono font-semibold text-neutral-900 text-xs bg-neutral-200 px-2 py-0.5 rounded">
                            {confirmationId.slice(0, 8).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Huésped</span>
                        <span className="font-medium text-neutral-900">{guestName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Habitación</span>
                        <span className="font-medium text-neutral-900">
                            {room.roomTypeName} · {room.number}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Check-in</span>
                        <span className="font-medium text-neutral-900">{formatDate(checkIn)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Check-out</span>
                        <span className="font-medium text-neutral-900">{formatDate(checkOut)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-neutral-500">Noches</span>
                        <span className="font-medium text-neutral-900">{nightCount}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-neutral-200 pt-3 mt-1">
                        <span className="font-semibold text-neutral-900">Total</span>
                        <span className="font-bold text-neutral-900">S/ {total.toFixed(2)}</span>
                    </div>
                </div>

                {/* Botón nueva reserva */}
                <button
                    onClick={onNewBooking}
                    className="w-full flex items-center justify-center gap-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                    <FaBed className="text-xs" /> Hacer otra reserva
                </button>
            </div>
        </div>
    );
};

export default Confirmation;