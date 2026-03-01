import { FaBed, FaUsers, FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import { Room } from '../types';
import { ROOM_IMAGES, TDict } from '../constants';

interface Props {
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
  t: TDict;
}

const nights = (ci: string, co: string) =>
  Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

export default function RoomList({
  rooms, checkIn, checkOut, convert, onSelect, onChangeDates, currency, selectedCurName, rates, t
}: Props) {
  return (
    <div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        .room-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .room-card:hover { transform: translateY(-3px); }
        .room-img { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
        .room-card:hover .room-img { transform: scale(1.06); }
        .select-btn {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 15px rgba(5,150,105,0.35);
          transition: all 0.2s ease;
        }
        .select-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(5,150,105,0.45); }
        .room-number-badge {
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.15);
        }
      `}</style>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {t.availableRooms(rooms.length)}
          </h2>
          {currency !== 'PEN' && Object.keys(rates).length > 0 && (
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span>
              {t.priceRealtime(selectedCurName)}
            </p>
          )}
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
          <div className="h-20 w-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <FaBed className="text-gray-300 text-3xl" />
          </div>
          <p className="font-bold text-gray-700 text-lg mb-2">{t.noRooms}</p>
          <p className="text-sm text-gray-400 mb-6">{t.noRoomsSub}</p>
          <button
            onClick={onChangeDates}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-6 py-2.5 rounded-xl transition-colors border border-emerald-200"
          >
            {t.changeDates}
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className="room-card bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-gray-100 hover:border-emerald-100"
            >
              <div className="flex flex-col md:flex-row">
                {/* Imagen */}
                <div className="md:w-72 h-56 md:h-auto flex-shrink-0 relative overflow-hidden bg-gray-100">
                  <img
                    src={ROOM_IMAGES[idx % ROOM_IMAGES.length]}
                    alt={room.roomTypeName}
                    className="room-img w-full h-full object-cover"
                    onError={e => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                      if (el.parentElement) {
                        el.parentElement.className = 'md:w-72 h-56 md:h-full flex-shrink-0 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-2 text-emerald-300';
                        el.parentElement.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' class='h-12 w-12' fill='currentColor' viewBox='0 0 20 20'><path d='M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'/></svg>`;
                      }
                    }}
                  />
                  {/* Badge habitación */}
                  <div className="absolute top-3 left-3 room-number-badge text-white text-xs font-bold px-3 py-1.5 rounded-xl">
                    {t.hab} {room.number}
                  </div>
                  {/* Degradado inferior */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent md:hidden" />
                </div>

                {/* Contenido */}
                <div className="flex-1 p-6 flex flex-col justify-between" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <div>
                    <h3
                      className="text-xl font-bold text-gray-900 mb-4 capitalize"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {room.roomTypeName}
                    </h3>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-xl border border-emerald-100">
                        <FaUsers className="text-emerald-500" /> {room.capacity} {t.people}
                      </span>
                      <span className="flex items-center gap-2 bg-gray-50 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl border border-gray-100">
                        <FaMapMarkerAlt className="text-emerald-500" /> {t.floor} {room.floor}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-end justify-between mt-6 pt-5 border-t border-gray-100">
                    <div>
                      <p className="text-3xl font-black text-gray-900">{convert(room.pricePerNight)}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {t.perNight} ·{' '}
                        <span className="text-gray-700 font-semibold">
                          {t.total} {convert(room.pricePerNight * nights(checkIn, checkOut))}
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => onSelect(room)}
                      className="select-btn flex items-center gap-2 text-white text-sm font-bold px-7 py-3.5 rounded-xl"
                    >
                      {t.select} <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}