import { FaArrowRight, FaMoon, FaBed } from 'react-icons/fa';

interface Room {
    id: string;
    number: string;
    floor: number;
    roomTypeName: string;
    pricePerNight: number;
    capacity: number;
}

interface BookingSummaryProps {
    checkIn: string;
    checkOut: string;
    room: Room | null;
    nightCount: number;
    total: number;
    step: number;
    onChangeRoom: () => void;
    onContinue: () => void;
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

const BookingSummary = ({ checkIn, checkOut, room, nightCount, total, step, onChangeRoom, onContinue }: BookingSummaryProps) => {
    return (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 sticky top-24">
            <h3 className="font-semibold text-neutral-900 mb-4 text-sm">Resumen de la reserva</h3>

            {/* Fechas */}
            <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-neutral-600">{formatDate(checkIn)}</span>
                <FaArrowRight className="text-neutral-300 text-xs" />
                <span className="text-neutral-600">{formatDate(checkOut)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-4">
                <FaMoon className="text-xs" />
                <span>{nightCount} {nightCount === 1 ? 'noche' : 'noches'}</span>
            </div>

            {room ? (
                <>
                    <div className="border-t border-neutral-100 pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-neutral-900">{room.roomTypeName}</p>
                                <p className="text-xs text-neutral-400">Hab. {room.number} · Piso {room.floor}</p>
                            </div>
                            <button
                                onClick={onChangeRoom}
                                className="text-xs text-red-400 hover:text-red-600 transition-colors"
                            >
                                Cambiar
                            </button>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-neutral-500">
                                S/ {room.pricePerNight.toFixed(2)} × {nightCount} noches
                            </span>
                            <span className="text-neutral-700 font-medium">S/ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="border-t border-neutral-200 mt-4 pt-4 flex justify-between">
                        <span className="font-semibold text-neutral-900 text-sm">Total</span>
                        <span className="font-bold text-neutral-900">S/ {total.toFixed(2)}</span>
                    </div>

                    {step === 2 && (
                        <button
                            onClick={onContinue}
                            className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            Continuar <FaArrowRight className="text-xs" />
                        </button>
                    )}
                </>
            ) : (
                <div className="border-t border-neutral-100 pt-4 text-center">
                    <FaBed className="text-neutral-200 text-3xl mx-auto mb-2" />
                    <p className="text-sm text-neutral-400">Selecciona una habitación</p>
                </div>
            )}
        </div>
    );
};

export default BookingSummary;