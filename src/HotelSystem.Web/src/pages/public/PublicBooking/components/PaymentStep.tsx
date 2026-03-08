import { FaArrowLeft, FaCheck } from 'react-icons/fa';
import { BookingState } from '../types';
import { TDict, Lang } from '../constants';

interface Props {
  booking: BookingState;
  total: number;
  paymentUrl: string;
  paymentOpened: boolean;
  setPaymentOpened: (v: boolean) => void;
  onBack: () => void;
  onConfirm: () => void;
  submitting: boolean;
  t: TDict;
  lang: Lang;
  formatDate: (d: string) => string;
}

export default function PaymentStep({
  booking, total, paymentUrl, paymentOpened, setPaymentOpened,
  onBack, onConfirm, submitting, t, lang, formatDate
}: Props) {
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
            {lang === 'es' ? 'Completar pago' : 'Complete payment'}
          </h2>
          <p className="text-sm text-gray-400">
            {lang === 'es' ? 'Revisa tu reserva y procede al pago seguro' : 'Review your booking and proceed to secure payment'}
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">

        {/* Resumen de reserva */}
        <div className="bg-gradient-to-br from-gray-50 to-emerald-50/50 rounded-xl p-5 border border-emerald-100 space-y-3">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">
            {lang === 'es' ? 'Resumen' : 'Summary'}
          </h4>
          {[
            { label: lang === 'es' ? 'Habitación' : 'Room', value: `${booking.room?.roomTypeName} · ${t.hab} ${booking.room?.number}` },
            { label: lang === 'es' ? 'Huésped' : 'Guest', value: `${booking.guest.firstName} ${booking.guest.lastName}` },
            { label: 'Check-in', value: formatDate(booking.checkIn) },
            { label: 'Check-out', value: formatDate(booking.checkOut) },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-gray-400 font-medium">{label}</span>
              <span className="font-semibold text-gray-800">{value}</span>
            </div>
          ))}
          <div className="flex justify-between text-base font-black border-t border-emerald-200 pt-3 mt-2">
            <span className="text-gray-800">Total</span>
            <span className="text-emerald-600 text-lg">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Métodos de pago */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-3">
            {lang === 'es' ? 'Métodos de pago aceptados' : 'Accepted payment methods'}
          </p>
          <div className="flex justify-center gap-2 flex-wrap">
            {['Visa', 'Mastercard', 'Yape', 'Plin', 'BCP', 'Interbank'].map(m => (
              <span
                key={m}
                className="text-xs bg-white text-gray-600 px-3 py-2 rounded-xl font-semibold border border-gray-200 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-colors cursor-default"
              >
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Botón principal MercadoPago */}
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => setPaymentOpened(true)}
          className="w-full text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-base shadow-xl transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: 'linear-gradient(135deg, #009ee3 0%, #0078b4 100%)', boxShadow: '0 6px 25px rgba(0,158,227,0.35)', display: 'flex' }}
        >
          🔒 {lang === 'es' ? 'Ir a pagar ahora' : 'Go to payment now'}
        </a>

        {/* Botón confirmar después de pagar */}
        {paymentOpened && (
          <button
            onClick={onConfirm}
            disabled={submitting}
            className="w-full text-white font-bold py-4 rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-base shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 6px 20px rgba(5,150,105,0.4)' }}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {lang === 'es' ? 'Confirmando reserva...' : 'Confirming booking...'}
              </>
            ) : (
              <>
                <FaCheck />
                {lang === 'es' ? '✓ Ya pagué — Confirmar reserva' : '✓ I paid — Confirm booking'}
              </>
            )}
          </button>
        )}


        {/* SSL badge */}
        <p className="text-xs text-gray-400 text-center">
          🔒 {lang === 'es'
            ? 'Pago 100% seguro · Encriptado SSL · Datos protegidos'
            : '100% secure · SSL encrypted · Protected data'}
        </p>
      </div>
    </div>
  );
}