import { FaArrowRight, FaBed, FaMoon } from 'react-icons/fa';
import { BookingState } from '../types';
import { TDict, Lang } from '../constants';

interface Props {
  booking: BookingState;
  nightCount: number;
  total: number;
  convert: (pen: number) => string;
  step: number;
  onContinue: () => void;
  onChangeRoom: () => void;
  t: TDict;
  lang: Lang;
  formatDate: (d: string) => string;
}

export default function BookingSidebar({
  booking, nightCount, total, convert, step, onContinue, onChangeRoom, t, formatDate
}: Props) {
  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-6 sticky top-20 shadow-sm overflow-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Acento superior */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 rounded-t-2xl" />

      <h3 className="font-bold text-gray-900 text-base mb-5 mt-1">{t.bookingSummary}</h3>

      {/* Fechas */}
      <div className="flex items-center justify-between text-sm mb-3 bg-gray-50 rounded-xl px-3 py-2.5">
        <span className="text-gray-600 font-medium">{formatDate(booking.checkIn)}</span>
        <FaArrowRight className="text-emerald-400 text-xs" />
        <span className="text-gray-600 font-medium">{formatDate(booking.checkOut)}</span>
      </div>

      {/* Noches */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-5 px-1">
        <FaMoon className="text-emerald-500 text-xs" />
        <span className="font-semibold text-gray-700">{nightCount}</span>
        <span>{nightCount === 1 ? t.night : t.nights}</span>
      </div>

      {booking.room ? (
        <>
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gray-900 capitalize">{booking.room.roomTypeName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{t.hab} {booking.room.number} · {t.floor} {booking.room.floor}</p>
              </div>
              <button
                onClick={onChangeRoom}
                className="text-xs text-red-400 hover:text-red-600 font-semibold bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
              >
                {t.change}
              </button>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">
                {convert(booking.room.pricePerNight)} × {nightCount} {nightCount === 1 ? t.night : t.nights}
              </span>
              <span className="text-gray-700 font-semibold">{convert(total)}</span>
            </div>
          </div>

          <div className="border-t border-gray-200 mt-4 pt-4 flex justify-between items-center">
            <span className="font-bold text-gray-900">{t.total}</span>
            <span className="font-black text-xl text-emerald-600">{convert(total)}</span>
          </div>

          {step === 2 && (
            <button
              onClick={onContinue}
              className="w-full mt-5 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 text-sm hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 15px rgba(5,150,105,0.35)' }}
            >
              {t.continue} <FaArrowRight className="text-xs" />
            </button>
          )}
        </>
      ) : (
        <div className="border-t border-gray-100 pt-5 text-center">
          <div className="h-14 w-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <FaBed className="text-gray-300 text-2xl" />
          </div>
          <p className="text-sm text-gray-400">{t.selectRoom}</p>
        </div>
      )}
    </div>
  );
}