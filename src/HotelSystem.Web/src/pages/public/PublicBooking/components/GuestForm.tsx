import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { BookingState } from '../types';
import { COUNTRIES, TDict, Lang } from '../constants';

interface Props {
  booking: BookingState;
  setBooking: React.Dispatch<React.SetStateAction<BookingState>>;
  onBack: () => void;
  onProceed: () => void;
  submitting: boolean;
  error: string;
  t: TDict;
  lang: Lang;
}

export default function GuestForm({ booking, setBooking, onBack, onProceed, submitting, error, t, lang }: Props) {
  const inputClass = "w-full px-4 py-3 border-2 border-gray-100 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 placeholder-gray-300";
  const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2";

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@300;400;500;600&display=swap');`}</style>

      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <button
          onClick={onBack}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300 hover:shadow-md transition-all"
        >
          <FaArrowLeft className="text-sm" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t.guestData}
          </h2>
          <p className="text-sm text-gray-400">{t.guestDataSub}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-5">

        {/* Nombre y Apellido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.firstName} *</label>
            <input
              type="text"
              value={booking.guest.firstName}
              onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, firstName: e.target.value } }))}
              placeholder="Juan"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.lastName} *</label>
            <input
              type="text"
              value={booking.guest.lastName}
              onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, lastName: e.target.value } }))}
              placeholder="Pérez"
              className={inputClass}
            />
          </div>
        </div>

        {/* Nacionalidad */}
        <div>
          <label className={labelClass}>{t.nationality} *</label>
          <select
            value={booking.guest.nationality}
            onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, nationality: e.target.value } }))}
            className={inputClass}
          >
            <option value="">{t.selectCountry}</option>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Email */}
        <div>
          <label className={labelClass}>{t.email} *</label>
          <input
            type="email"
            value={booking.guest.email}
            onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, email: e.target.value } }))}
            placeholder="juan@email.com"
            className={inputClass}
          />
        </div>

        {/* Teléfono y DNI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t.phone} *</label>
            <input
              type="tel"
              value={booking.guest.phone}
              onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, phone: e.target.value } }))}
              placeholder="+51 999 999 999"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.dni} *</label>
            <input
              type="text"
              value={booking.guest.identificationNumber}
              onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, identificationNumber: e.target.value } }))}
              placeholder="12345678"
              className={inputClass}
            />
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className={labelClass}>{t.notes}</label>
          <textarea
            value={booking.guest.notes}
            onChange={e => setBooking(p => ({ ...p, guest: { ...p.guest, notes: e.target.value } }))}
            placeholder={t.notesPlaceholder}
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <span className="text-red-400">⚠</span> {error}
          </div>
        )}

        {/* Botón pagar */}
        <button
          onClick={onProceed}
          disabled={submitting}
          className="w-full text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-3 text-base shadow-xl"
          style={{ background: 'linear-gradient(135deg, #009ee3 0%, #0078b4 100%)', boxShadow: '0 6px 25px rgba(0,158,227,0.35)' }}
        >
          {submitting ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {lang === 'es' ? 'Procesando...' : 'Processing...'}
            </>
          ) : (
            <>{lang === 'es' ? '🔒 Pagar con MercadoPago' : '🔒 Pay with MercadoPago'}</>
          )}
        </button>

        {/* Seguridad */}
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1.5">
          <FaShieldAlt className="text-emerald-500" /> {t.secure}
        </p>
      </div>
    </div>
  );
}