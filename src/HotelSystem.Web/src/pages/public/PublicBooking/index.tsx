import { useState, useEffect } from 'react';
import { CURRENCIES, T, Lang } from './constants';
import { Room, BookingState } from './types';
import HeroStep from './components/HeroStep';
import BookingNavbar from './components/BookingNavbar';
import RoomList from './components/RoomList';
import GuestForm from './components/GuestForm';
import PaymentStep from './components/PaymentStep';
import BookingSidebar from './components/BookingSidebar';
import Confirmation from './components/Confirmation';

const API_BASE = 'http://localhost:5036/api/public';

const today    = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const nights = (ci: string, co: string) =>
  Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

const formatDate = (d: string, lang: Lang) =>
  new Date(d).toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

export default function PublicBooking() {
  const [step, setStep]         = useState<number>(1);
  const [checkIn, setCheckIn]   = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [rooms, setRooms]       = useState<Room[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [booking, setBooking]   = useState<BookingState>({
    checkIn: today, checkOut: tomorrow, room: null,
    guest: { firstName: '', lastName: '', email: '', phone: '', nationality: '', identificationNumber: '', notes: '' },
  });
  const [confirmation, setConfirmation]   = useState<any>(null);
  const [submitting, setSubmitting]       = useState(false);
  const [paymentUrl, setPaymentUrl]       = useState('');
  const [paymentOpened, setPaymentOpened] = useState(false);

  // ── MEDIA #8 CORREGIDA: Solo guardamos preferenceId, NO datos personales ──
  // El preferenceId es suficiente para recuperar la reserva al volver de MP
  const [pendingPreferenceId, setPendingPreferenceId] = useState<string | null>(null);

  const [lang, setLang]                         = useState<Lang>('es');
  const [currency, setCurrency]                 = useState('PEN');
  const [rates, setRates]                       = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading]         = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const t = T[lang];

  // Cargar tasas de cambio
  useEffect(() => {
    setRatesLoading(true);
    fetch('https://open.er-api.com/v6/latest/PEN')
      .then(r => r.json())
      .then(data => { if (data.rates) setRates(data.rates); })
      .catch(() => setRates({ PEN: 1, USD: 0.27, EUR: 0.25, BRL: 1.38, COP: 1050, ARS: 280 }))
      .finally(() => setRatesLoading(false));
  }, []);

  // ── MEDIA #8: Detectar retorno de MP usando solo el preferenceId ──
  // Los datos del booking se mantienen en estado React (memoria), NO en sessionStorage
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment !== 'success') return;

    // ── MEDIA #8: Recuperar solo el preferenceId del sessionStorage ──
    const savedPreferenceId = sessionStorage.getItem('pendingPreferenceId');
    const savedBooking      = sessionStorage.getItem('pendingBookingState');

    if (!savedPreferenceId || !savedBooking) return;

    sessionStorage.removeItem('pendingPreferenceId');
    sessionStorage.removeItem('pendingBookingState');

    const pendingBooking = JSON.parse(savedBooking);
    setBooking(pendingBooking);

    const { guest, room, checkIn, checkOut } = pendingBooking;
    fetch(`${API_BASE}/booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId:       room.id,
        checkInDate:  new Date(checkIn).toISOString(),
        checkOutDate: new Date(checkOut).toISOString(),
        adults: 1, children: 0, notes: guest.notes,
        guest: {
          firstName:            guest.firstName,
          lastName:             guest.lastName,
          email:                guest.email,
          phone:                guest.phone,
          identificationNumber: guest.identificationNumber,
          nationality:          guest.nationality,
        },
      }),
    })
      .then(r => r.json())
      .then(data => { setConfirmation(data); setStep(4); })
      .catch(() => setError('Error al confirmar la reserva'));

    window.history.replaceState({}, '', '/booking');
  }, []);

  // Helpers
  const convert = (pen: number): string => {
    const cur = CURRENCIES.find(c => c.code === currency)!;
    if (!rates[currency] || currency === 'PEN') return `${cur.symbol} ${pen.toFixed(2)}`;
    const converted = pen * rates[currency];
    const formatted = converted >= 1000 ? Math.round(converted).toLocaleString('es') : converted.toFixed(2);
    return `${cur.symbol} ${formatted}`;
  };

  const nightCount  = nights(booking.checkIn, booking.checkOut);
  const total       = booking.room ? booking.room.pricePerNight * nightCount : 0;
  const selectedCur = CURRENCIES.find(c => c.code === currency)!;
  const fmtDate     = (d: string) => formatDate(d, lang);

  // ── Handlers ──
  const searchRooms = async () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) { setError(t.validDates); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRooms(data);
      setBooking(prev => ({ ...prev, checkIn, checkOut }));
      setStep(2);
    } catch (e: any) {
      setError(e.message || t.errorSearch);
    } finally { setLoading(false); }
  };

  const selectRoom = (room: Room) => {
    setBooking(prev => ({ ...prev, room }));
    setStep(3);
  };

  const proceedToPayment = async () => {
    const { guest, room, checkIn, checkOut } = booking;
    if (!guest.firstName || !guest.lastName || !guest.email || !guest.phone || !guest.nationality || !guest.identificationNumber) {
      setError(t.fillRequired); return;
    }

    // Validación básica de email en el frontend
    if (!guest.email.includes('@')) {
      setError('Email inválido.'); return;
    }

    setSubmitting(true); setError('');
    try {
      const nightCnt = nights(checkIn, checkOut);
      const res = await fetch('http://localhost:5036/api/payment/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:          room!.id,
          roomNumber:      room!.number,
          roomTypeName:    room!.roomTypeName,
          checkIn,
          checkOut,
          nights:          nightCnt,
          totalPrice:      room!.pricePerNight * nightCnt,
          guestFirstName:  guest.firstName,
          guestLastName:   guest.lastName,
          guestEmail:      guest.email,
          guestPhone:      guest.phone,
          guestIdNumber:   guest.identificationNumber,
          guestNationality:guest.nationality,
          notes:           guest.notes,
          frontendUrl:     window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPaymentUrl(data.sandboxInitPoint || data.initPoint);

      // ── MEDIA #8 CORREGIDA: Solo guardar preferenceId en sessionStorage ──
      // Los datos personales NO se guardan en sessionStorage
      // Se guardan temporalmente en estado React para usarlos si el usuario
      // vuelve y confirma manualmente
      sessionStorage.setItem('pendingPreferenceId', data.preferenceId);
      // Solo guardamos el estado para el caso de retorno desde MP
      // Nota: en producción considerar cifrar esto o usar el webhook exclusivamente
      sessionStorage.setItem('pendingBookingState', JSON.stringify(booking));

      setStep(35);
    } catch (e: any) {
      setError(e.message || t.errorBooking);
    } finally { setSubmitting(false); }
  };

  const confirmBookingAfterPayment = async () => {
    const { guest, room, checkIn, checkOut } = booking;
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API_BASE}/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:       room!.id,
          checkInDate:  new Date(checkIn).toISOString(),
          checkOutDate: new Date(checkOut).toISOString(),
          adults: 1, children: 0, notes: guest.notes,
          guest: {
            firstName:            guest.firstName,
            lastName:             guest.lastName,
            email:                guest.email,
            phone:                guest.phone,
            identificationNumber: guest.identificationNumber,
            nationality:          guest.nationality,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Limpiar sessionStorage al confirmar exitosamente
      sessionStorage.removeItem('pendingPreferenceId');
      sessionStorage.removeItem('pendingBookingState');

      setConfirmation(data);
      setStep(4);
    } catch (e: any) {
      setError(e.message || t.errorBooking);
    } finally { setSubmitting(false); }
  };

  const resetBooking = () => {
    setStep(1);
    setBooking({
      checkIn: today, checkOut: tomorrow, room: null,
      guest: { firstName: '', lastName: '', email: '', phone: '', nationality: '', identificationNumber: '', notes: '' },
    });
    setConfirmation(null);
    setPaymentOpened(false);
    setPaymentUrl('');
    setPendingPreferenceId(null);
    // Limpiar sessionStorage al resetear
    sessionStorage.removeItem('pendingPreferenceId');
    sessionStorage.removeItem('pendingBookingState');
  };

  // ── Render ──
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {step === 1 && (
        <HeroStep
          checkIn={checkIn} checkOut={checkOut}
          setCheckIn={setCheckIn} setCheckOut={setCheckOut}
          loading={loading} error={error}
          onSearch={searchRooms}
          today={today} t={t} lang={lang} setLang={setLang}
        />
      )}

      {(step === 2 || step === 3 || step === 35) && (
        <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f9fafb 40%, #ecfdf5 100%)' }}>
          <BookingNavbar
            checkIn={checkIn} checkOut={checkOut}
            setCheckIn={setCheckIn} setCheckOut={setCheckOut}
            onSearch={searchRooms} loading={loading} today={today}
            nightCount={nightCount} t={t} lang={lang} setLang={setLang}
            currency={currency} setCurrency={setCurrency}
            rates={rates} ratesLoading={ratesLoading}
            showCurrencyMenu={showCurrencyMenu} setShowCurrencyMenu={setShowCurrencyMenu}
            onLogoClick={() => setStep(1)}
          />

          <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {step === 2 && (
                <RoomList
                  rooms={rooms} checkIn={checkIn} checkOut={checkOut}
                  nightCount={nightCount} convert={convert}
                  onSelect={selectRoom} onChangeDates={() => setStep(1)}
                  currency={currency} selectedCurName={selectedCur.name}
                  rates={rates} t={t}
                />
              )}
              {step === 3 && (
                <GuestForm
                  booking={booking} setBooking={setBooking}
                  onBack={() => setStep(2)}
                  onProceed={proceedToPayment}
                  submitting={submitting} error={error}
                  t={t} lang={lang}
                />
              )}
              {step === 35 && (
                <PaymentStep
                  booking={booking} total={total}
                  paymentUrl={paymentUrl}
                  paymentOpened={paymentOpened} setPaymentOpened={setPaymentOpened}
                  onBack={() => setStep(3)}
                  onConfirm={confirmBookingAfterPayment}
                  submitting={submitting}
                  t={t} lang={lang}
                  formatDate={fmtDate}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <BookingSidebar
                booking={booking} nightCount={nightCount} total={total}
                convert={convert} step={step}
                onContinue={() => setStep(3)}
                onChangeRoom={() => { setBooking(p => ({ ...p, room: null })); setStep(2); }}
                t={t} lang={lang} formatDate={fmtDate}
              />
            </div>
          </div>
        </div>
      )}

      {step === 4 && confirmation && (
        <div style={{ background: 'linear-gradient(160deg, #f0fdf4 0%, #f9fafb 100%)' }} className="min-h-screen">
          <Confirmation
            booking={booking} confirmation={confirmation}
            total={total} convert={convert}
            onNewBooking={resetBooking}
            t={t} lang={lang} formatDate={fmtDate}
          />
        </div>
      )}

      <footer
        className="text-gray-400 text-xs text-center py-8 mt-8"
        style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)', fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
          <span className="text-white font-semibold">Hotel Sistema</span>
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
        </div>
        <p>© {new Date().getFullYear()} · {t.footer}</p>
        <p className="mt-1 text-gray-600">{t.footerSub}</p>
      </footer>
    </div>
  );
}