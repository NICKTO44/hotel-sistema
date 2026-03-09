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

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5036/api') + '/public';
const API_URL  = import.meta.env.VITE_API_URL || 'http://localhost:5036/api';

const today    = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

const nights = (ci: string, co: string) =>
  Math.max(1, Math.round((new Date(co).getTime() - new Date(ci).getTime()) / 86400000));

const formatDate = (d: string, lang: Lang) =>
  new Date(d).toLocaleDateString(lang === 'es' ? 'es-PE' : 'en-US', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

const SESSION_KEY = 'bookingSession';

function saveSession(step: number, booking: BookingState, rooms: Room[], checkIn: string, checkOut: string) {
  // No guardar step 4 (confirmación) ni step 35 (pago externo)
  if (step === 4 || step === 35) return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ step, booking, rooms, checkIn, checkOut }));
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export default function PublicBooking() {
  const saved = loadSession();

  const [step, setStep]         = useState<number>(saved?.step ?? 1);
  const [checkIn, setCheckIn]   = useState(saved?.checkIn ?? today);
  const [checkOut, setCheckOut] = useState(saved?.checkOut ?? tomorrow);
  const [rooms, setRooms]       = useState<Room[]>(saved?.rooms ?? []);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [booking, setBooking]   = useState<BookingState>(saved?.booking ?? {
    checkIn: today, checkOut: tomorrow, room: null,
    guest: { firstName: '', lastName: '', email: '', phone: '', nationality: '', identificationNumber: '', notes: '' },
  });
  const [confirmation, setConfirmation] = useState<any>(null);
  const [submitting, setSubmitting]     = useState(false);
  const [paymentUrl, setPaymentUrl]     = useState('');

  const [lang, setLang]                         = useState<Lang>('es');
  const [currency, setCurrency]                 = useState('PEN');
  const [rates, setRates]                       = useState<Record<string, number>>({});
  const [ratesLoading, setRatesLoading]         = useState(false);
  const [showCurrencyMenu, setShowCurrencyMenu] = useState(false);

  const t = T[lang];

  // Guardar sesión cada vez que cambia step, booking, rooms o fechas
  useEffect(() => {
    saveSession(step, booking, rooms, checkIn, checkOut);
  }, [step, booking, rooms, checkIn, checkOut]);

  useEffect(() => {
    setRatesLoading(true);
    fetch('https://open.er-api.com/v6/latest/PEN')
      .then(r => r.json())
      .then(data => { if (data.rates) setRates(data.rates); })
      .catch(() => setRates({ PEN: 1, USD: 0.27, EUR: 0.25, BRL: 1.38, COP: 1050, ARS: 280 }))
      .finally(() => setRatesLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment !== 'success') return;

    const savedPreferenceId = sessionStorage.getItem('pendingPreferenceId');
    const savedBooking      = sessionStorage.getItem('pendingBookingState');
    const preferenceId      = params.get('preference_id') || savedPreferenceId;

    if (!preferenceId) return;

    sessionStorage.removeItem('pendingPreferenceId');
    sessionStorage.removeItem('pendingBookingState');
    sessionStorage.removeItem(SESSION_KEY);

    if (savedBooking) {
      setBooking(JSON.parse(savedBooking));
    }

    fetch(`${API_URL}/payment/confirm-by-preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferenceId }),
    })
      .then(r => r.json())
      .then(data => {
        localStorage.setItem('payment_confirmed', JSON.stringify({ data, timestamp: Date.now() }));
        setConfirmation(data);
        setStep(4);
      })
      .catch(() => setError('Error al confirmar la reserva'));

    window.history.replaceState({}, '', '/booking');
  }, []);

  useEffect(() => {
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'payment_confirmed' && e.newValue) {
        try {
          const { data } = JSON.parse(e.newValue);
          localStorage.removeItem('payment_confirmed');
          setConfirmation(data);
          setStep(4);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);
    return () => window.removeEventListener('storage', handleStorageEvent);
  }, []);

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

  const searchRooms = async () => {
    if (!checkIn || !checkOut || checkIn >= checkOut) { setError(t.validDates); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_BASE}/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setRooms(data);
      setBooking(prev => ({ ...prev, checkIn, checkOut, room: null }));
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
    if (!guest.email.includes('@')) { setError('Email inválido.'); return; }

    setSubmitting(true); setError('');
    try {
      const nightCnt = nights(checkIn, checkOut);
      const res = await fetch(`${API_URL}/payment/create-preference`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId:           room!.id,
          roomNumber:       room!.number,
          roomTypeName:     room!.roomTypeName,
          checkIn, checkOut,
          nights:           nightCnt,
          totalPrice:       room!.pricePerNight * nightCnt,
          guestFirstName:   guest.firstName,
          guestLastName:    guest.lastName,
          guestEmail:       guest.email,
          guestPhone:       guest.phone,
          guestIdNumber:    guest.identificationNumber,
          guestNationality: guest.nationality,
          notes:            guest.notes,
          frontendUrl:      window.location.origin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setPaymentUrl(data.initPoint);
      sessionStorage.setItem('pendingPreferenceId', data.preferenceId);
      sessionStorage.setItem('pendingBookingState', JSON.stringify(booking));
      setStep(35);
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
    setPaymentUrl('');
    sessionStorage.removeItem('pendingPreferenceId');
    sessionStorage.removeItem('pendingBookingState');
    sessionStorage.removeItem(SESSION_KEY);
  };

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
                  onBack={() => setStep(3)}
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