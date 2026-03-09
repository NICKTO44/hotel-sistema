import { useState } from 'react';
import { FaArrowLeft, FaArrowRight, FaUsers, FaMapMarkerAlt, FaBed, FaWifi, FaTv, FaSnowflake, FaShower, FaCoffee, FaParking } from 'react-icons/fa';

interface Room {
  id: string;
  number: string;
  floor: number;
  roomTypeName: string;
  pricePerNight: number;
  capacity: number;
  imageUrl?: string;
}

interface RoomListProps {
  rooms: Room[];
  checkIn: string;
  checkOut: string;
  nightCount: number;
  convert: (pen: number) => string;
  onSelect: (room: Room) => void;
  onChangeDates: () => void;
  currency: string;
  selectedCurName: string;
  rates: Record<string, number>;
  t: any;
}

const ROOM_TYPE_INFO: Record<string, { description: string; amenities: string[] }> = {
  Standard: {
    description: 'Habitación confortable con todo lo esencial para una estadía perfecta.',
    amenities: ['WiFi', 'TV', 'AC', 'Baño privado'],
  },
  Deluxe: {
    description: 'Espaciosa y elegante, con vista privilegiada y acabados premium.',
    amenities: ['WiFi', 'TV', 'AC', 'Baño privado', 'Café'],
  },
  Suite: {
    description: 'Experiencia de lujo con sala de estar, minibar y vistas panorámicas.',
    amenities: ['WiFi', 'TV', 'AC', 'Baño privado', 'Café', 'Parking'],
  },
  Junior: {
    description: 'Diseño moderno con área de trabajo y amenidades de confort.',
    amenities: ['WiFi', 'TV', 'AC', 'Baño privado'],
  },
};

const AMENITY_ICONS: Record<string, JSX.Element> = {
  'WiFi':         <FaWifi />,
  'TV':           <FaTv />,
  'AC':           <FaSnowflake />,
  'Baño privado': <FaShower />,
  'Café':         <FaCoffee />,
  'Parking':      <FaParking />,
};

const ROOM_IMAGES: Record<string, string> = {
  Standard: '/images/habitaciones/habitacion1.jpeg',
  Deluxe:   '/images/habitaciones/habitacion3.webp',
  Suite:    '/images/habitaciones/habitacion5.jpg',
  Junior:   '/images/habitaciones/habitacion7.webp',
};

const DEFAULT_IMAGE = '/images/habitaciones/habitacion2.webp';

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });

function getRoomInfo(typeName: string) {
  const key = Object.keys(ROOM_TYPE_INFO).find(k =>
    typeName.toLowerCase().includes(k.toLowerCase())
  );
  return key
    ? ROOM_TYPE_INFO[key]
    : { description: 'Habitación cómoda y bien equipada para tu estadía.', amenities: ['WiFi', 'TV', 'AC', 'Baño privado'] };
}

function getFallbackImage(typeName: string) {
  const key = Object.keys(ROOM_IMAGES).find(k =>
    typeName.toLowerCase().includes(k.toLowerCase())
  );
  return key ? ROOM_IMAGES[key] : DEFAULT_IMAGE;
}

const RoomList = ({
  rooms, checkIn, checkOut, nightCount, convert, onSelect, onChangeDates, t
}: RoomListProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onChangeDates}
          className="text-neutral-400 hover:text-neutral-700 p-2 rounded-xl hover:bg-white transition-all border border-transparent hover:border-neutral-200 hover:shadow-sm"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-neutral-900">
            {t.availableRooms(rooms.length)}
          </h2>
          <p className="text-sm text-neutral-400 mt-0.5">
            {formatDate(checkIn)} → {formatDate(checkOut)} ·{' '}
            <span className="font-medium text-neutral-500">
              {nightCount} {nightCount === 1 ? t.night : t.nights}
            </span>
          </p>
        </div>
      </div>

      {/* Sin resultados */}
      {rooms.length === 0 ? (
        <div className="bg-white border border-neutral-100 rounded-2xl p-14 text-center shadow-sm">
          <div className="w-16 h-16 bg-neutral-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FaBed className="text-neutral-300 text-2xl" />
          </div>
          <p className="font-semibold text-neutral-700">{t.noRooms}</p>
          <p className="text-sm text-neutral-400 mt-1">{t.noRoomsSub}</p>
          <button
            onClick={onChangeDates}
            className="mt-5 text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors"
          >
            {t.changeDates}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => {
            const info  = getRoomInfo(room.roomTypeName);
            const img   = room.imageUrl || getFallbackImage(room.roomTypeName);
            const isHov = hoveredId === room.id;

            return (
              <div
                key={room.id}
                onMouseEnter={() => setHoveredId(room.id)}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-white rounded-2xl overflow-hidden transition-all duration-300"
                style={{
                  border: isHov ? '1.5px solid #10b981' : '1.5px solid #f0f0f0',
                  boxShadow: isHov
                    ? '0 8px 32px rgba(16,185,129,0.10), 0 2px 8px rgba(0,0,0,0.04)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                  transform: isHov ? 'translateY(-2px)' : 'none',
                }}
              >
                {/* Mobile: vertical | Desktop: horizontal */}
                <div className="flex flex-col sm:flex-row">

                  {/* Imagen */}
                  <div
                    className="relative overflow-hidden flex-shrink-0"
                    style={{ height: '200px' }}
                  >
                    <style>{`
                      @media (min-width: 640px) {
                        .room-img-wrap { width: 240px !important; height: 100% !important; }
                      }
                    `}</style>
                    <div className="room-img-wrap w-full h-full" style={{ height: '200px' }}>
                      <img
                        src={img}
                        alt={room.roomTypeName}
                        className="w-full h-full object-cover transition-transform duration-500"
                        style={{ transform: isHov ? 'scale(1.06)' : 'scale(1)' }}
                        onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                    </div>
                    <div
                      className="absolute top-3 left-3 text-white text-xs font-bold px-2.5 py-1 rounded-lg"
                      style={{ background: 'rgba(10,10,10,0.75)', backdropFilter: 'blur(6px)' }}
                    >
                      {t.hab} {room.number}
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-bold text-neutral-900 text-base leading-tight">
                            {room.roomTypeName}
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                            <span className="flex items-center gap-1">
                              <FaUsers className="text-emerald-400" />
                              {room.capacity} {t.people}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt className="text-emerald-400" />
                              {t.floor} {room.floor}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-neutral-900 leading-none">
                            {convert(room.pricePerNight)}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5">{t.perNight}</p>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500 leading-relaxed mb-3 hidden sm:block">
                        {info.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {info.amenities.map(amenity => (
                          <span
                            key={amenity}
                            className="flex items-center gap-1 text-xs text-neutral-500 bg-neutral-50 border border-neutral-100 px-2 py-1 rounded-lg font-medium"
                          >
                            <span className="text-emerald-500 text-xs">
                              {AMENITY_ICONS[amenity] || null}
                            </span>
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                      <div>
                        <span className="text-xs text-neutral-400">{t.total} </span>
                        <span className="text-sm font-bold text-neutral-700">
                          {convert(room.pricePerNight * nightCount)}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {' '}· {nightCount} {nightCount === 1 ? t.night : t.nights}
                        </span>
                      </div>
                      <button
                        onClick={() => onSelect(room)}
                        className="flex items-center gap-2 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all duration-200"
                        style={{
                          background: isHov
                            ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          boxShadow: isHov
                            ? '0 4px 14px rgba(5,150,105,0.45)'
                            : '0 2px 8px rgba(16,185,129,0.25)',
                        }}
                      >
                        {t.select}
                        <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RoomList;