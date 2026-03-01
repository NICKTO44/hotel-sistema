import { FaArrowLeft, FaArrowRight, FaUsers, FaMapMarkerAlt, FaBed } from 'react-icons/fa';

interface Room {
    id: string;
    number: string;
    floor: number;
    roomTypeName: string;
    pricePerNight: number;
    capacity: number;
}

interface RoomListProps {
    rooms: Room[];
    checkIn: string;
    checkOut: string;
    nightCount: number;
    onSelect: (room: Room) => void;
    onBack: () => void;
}

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

const RoomList = ({ rooms, checkIn, checkOut, nightCount, onSelect, onBack }: RoomListProps) => {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Habitaciones disponibles</h2>
                    <p className="text-sm text-neutral-500">
                        {formatDate(checkIn)} → {formatDate(checkOut)} · {nightCount} {nightCount === 1 ? 'noche' : 'noches'}
                    </p>
                </div>
            </div>

            {/* Sin resultados */}
            {rooms.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl p-12 text-center">
                    <FaBed className="text-neutral-300 text-4xl mx-auto mb-3" />
                    <p className="font-semibold text-neutral-700">No hay habitaciones disponibles</p>
                    <p className="text-sm text-neutral-400 mt-1">Intenta con otras fechas</p>
                    <button
                        onClick={onBack}
                        className="mt-4 text-sm text-emerald-600 hover:underline"
                    >
                        Cambiar fechas
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {rooms.map(room => (
                        <div
                            key={room.id}
                            className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:border-emerald-300 hover:shadow-md transition-all"
                        >
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    {/* Badge número */}
                                    <div className="h-12 w-12 bg-neutral-900 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                        {room.number}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-neutral-900">{room.roomTypeName}</h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-neutral-500">
                                            <span className="flex items-center gap-1">
                                                <FaUsers className="text-xs" /> {room.capacity} personas
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <FaMapMarkerAlt className="text-xs" /> Piso {room.floor}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 md:flex-col md:items-end">
                                    <div className="text-right">
                                        <p className="text-xl font-bold text-neutral-900">
                                            S/ {room.pricePerNight.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-neutral-400">por noche</p>
                                    </div>
                                    <button
                                        onClick={() => onSelect(room)}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap"
                                    >
                                        Seleccionar <FaArrowRight className="text-xs" />
                                    </button>
                                </div>
                            </div>

                            {/* Footer con total */}
                            <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
                                <span className="text-xs text-neutral-500">
                                    Total por {nightCount} {nightCount === 1 ? 'noche' : 'noches'}:
                                </span>
                                <span className="text-sm font-semibold text-neutral-700">
                                    S/ {(room.pricePerNight * nightCount).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoomList;