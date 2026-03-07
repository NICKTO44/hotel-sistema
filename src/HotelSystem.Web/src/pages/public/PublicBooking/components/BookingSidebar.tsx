import { FaArrowRight, FaBed, FaMoon, FaCalendarAlt, FaCheckCircle } from 'react-icons/fa';
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
  const hasRoom = !!booking.room;

  return (
    <div
      className="sticky top-20 overflow-hidden rounded-2xl"
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: '#ffffff',
        border: '1.5px solid #f0f0f0',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Barra superior con gradiente */}
      <div
        className="h-1.5 w-full"
        style={{ background: 'linear-gradient(90deg, #34d399 0%, #10b981 50%, #0d9488 100%)' }}
      />

      <div className="p-6">

        {/* Título */}
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)' }}
          >
            <FaCalendarAlt className="text-emerald-600 text-xs" />
          </div>
          <h3 className="font-bold text-neutral-900 text-sm tracking-wide uppercase" style={{ letterSpacing: '0.06em' }}>
            {t.bookingSummary}
          </h3>
        </div>

        {/* Bloque de fechas */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: 'linear-gradient(135deg, #f9fafb 0%, #f0fdf4 100%)', border: '1px solid #e5e7eb' }}
        >
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-xs text-neutral-400 font-medium uppercase" style={{ letterSpacing: '0.05em' }}>
                {t.checkin}
              </p>
              <p className="text-sm font-bold text-neutral-800 mt-0.5">
                {formatDate(booking.checkIn)}
              </p>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div
                className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: '#ecfdf5', color: '#059669' }}
              >
                <FaMoon className="text-xs" />
                {nightCount} {nightCount === 1 ? t.night : t.nights}
              </div>
              <div className="w-12 h-px" style={{ background: 'linear-gradient(90deg, #34d399, #0d9488)' }} />
            </div>

            <div className="text-center">
              <p className="text-xs text-neutral-400 font-medium uppercase" style={{ letterSpacing: '0.05em' }}>
                {t.checkout}
              </p>
              <p className="text-sm font-bold text-neutral-800 mt-0.5">
                {formatDate(booking.checkOut)}
              </p>
            </div>
          </div>
        </div>

        {/* Sin habitación seleccionada */}
        {!hasRoom && (
          <div className="py-6 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: '#f9fafb', border: '1.5px dashed #e5e7eb' }}
            >
              <FaBed className="text-neutral-300 text-xl" />
            </div>
            <p className="text-sm font-medium text-neutral-400">{t.selectRoom}</p>
            <p className="text-xs text-neutral-300 mt-1">Elige una habitación de la lista</p>
          </div>
        )}

        {/* Con habitación seleccionada */}
        {hasRoom && booking.room && (
          <>
            {/* Card habitación */}
            <div
              className="rounded-xl p-3.5 mb-4"
              style={{ background: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ background: 'linear-gradient(135deg, #111827, #1f2937)' }}
                  >
                    {booking.room.number}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 capitalize leading-tight">
                      {booking.room.roomTypeName}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {t.floor} {booking.room.floor}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onChangeRoom}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex-shrink-0"
                  style={{ color: '#ef4444', background: '#fef2f2' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2';
                  }}
                >
                  {t.change}
                </button>
              </div>
            </div>

            {/* Desglose de precio */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">
                  {convert(booking.room.pricePerNight)} × {nightCount} {nightCount === 1 ? t.night : t.nights}
                </span>
                <span className="font-semibold text-neutral-700">{convert(total)}</span>
              </div>
              <div className="flex justify-between text-xs text-neutral-400">
                <span>Impuestos incluidos</span>
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <FaCheckCircle className="text-xs" /> Sin cargos extra
                </span>
              </div>
            </div>

            {/* Total */}
            <div
              className="rounded-xl px-4 py-3.5 mb-5 flex items-center justify-between"
              style={{
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                border: '1px solid #a7f3d0',
              }}
            >
              <span className="text-sm font-bold text-neutral-700">{t.total}</span>
              <span
                className="text-2xl font-black"
                style={{ color: '#047857' }}
              >
                {convert(total)}
              </span>
            </div>

            {/* Botón continuar */}
            {step === 2 && (
              <button
                onClick={onContinue}
                className="w-full text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 text-sm group"
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  boxShadow: '0 4px 16px rgba(5,150,105,0.35)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 20px rgba(5,150,105,0.50)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 16px rgba(5,150,105,0.35)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'none';
                }}
              >
                {t.continue}
                <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
              </button>
            )}
          </>
        )}

        {/* Badge seguridad */}
        <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-neutral-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
          </svg>
          Reserva segura · Sin comisiones
        </div>
      </div>
    </div>
  );
}