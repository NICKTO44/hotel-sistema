import { FaCheck } from 'react-icons/fa';
import { BookingState } from '../types';
import { TDict, Lang } from '../constants';

interface Props {
  booking: BookingState;
  confirmation: any;
  total: number;
  convert: (pen: number) => string;
  onNewBooking: () => void;
  t: TDict;
  lang: Lang;
  formatDate: (d: string) => string;
}

export default function Confirmation({ booking, confirmation, total, convert, onNewBooking, t, lang, formatDate }: Props) {
  return (
    <div
      className="max-w-lg mx-auto px-4 py-16 text-center"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');
        @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes confettiDrop { 0% { transform: translateY(-20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
        .pop-in { animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .confetti { animation: confettiDrop 0.5s ease forwards; }
      `}</style>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 md:p-10 shadow-xl relative overflow-hidden">
        {/* Franja decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-400 rounded-t-3xl" />

        {/* Confetti visual */}
        <div className="absolute top-6 left-6 text-2xl confetti" style={{ animationDelay: '0.1s' }}>🎉</div>
        <div className="absolute top-6 right-6 text-2xl confetti" style={{ animationDelay: '0.2s' }}>✨</div>

        {/* Ícono */}
        <div className="h-20 w-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-xl shadow-emerald-200 pop-in">
          <FaCheck className="text-white text-3xl" />
        </div>

        <h2
          className="text-3xl font-black text-gray-900 mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {t.confirmed}
        </h2>
        <p className="text-gray-400 text-sm mb-8">
          {t.confirmedSub(booking.guest.email)}{' '}
          <strong className="text-emerald-600">{booking.guest.email}</strong>
        </p>

        {/* Detalles de reserva */}
        <div className="bg-gradient-to-br from-gray-50 to-emerald-50/40 rounded-2xl p-5 text-left space-y-3 mb-8 border border-emerald-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            {lang === 'es' ? 'Detalles de la reserva' : 'Booking details'}
          </p>
          {[
            { label: t.reservationNum, value: confirmation.id?.slice(0, 8).toUpperCase(), mono: true },
            { label: t.guest, value: `${booking.guest.firstName} ${booking.guest.lastName}`, mono: false },
            { label: t.room, value: `${booking.room?.roomTypeName} · ${booking.room?.number}`, mono: false },
            { label: t.checkin, value: formatDate(booking.checkIn), mono: false },
            { label: t.checkout, value: formatDate(booking.checkOut), mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">{label}</span>
              <span className={`font-semibold text-gray-800 ${mono ? 'font-mono text-xs bg-gray-100 px-2 py-0.5 rounded' : ''}`}>
                {value}
              </span>
            </div>
          ))}
          <div className="flex justify-between text-sm border-t border-emerald-200 pt-3 mt-1">
            <span className="font-bold text-gray-900">{t.total}</span>
            <span className="font-black text-emerald-600 text-base">{convert(total)}</span>
          </div>
        </div>

        <button
          onClick={onNewBooking}
          className="w-full border-2 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 font-semibold py-3.5 rounded-xl transition-all text-sm"
        >
          {t.newBooking}
        </button>
      </div>
    </div>
  );
}