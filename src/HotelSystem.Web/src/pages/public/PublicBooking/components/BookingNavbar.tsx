import { FaBed, FaCalendarAlt, FaArrowRight, FaMoon, FaSearch } from 'react-icons/fa';
import { Lang, TDict } from '../constants';
import CurrencySelector from './CurrencySelector';
import LangSelector from './LangSelector';

interface Props {
  checkIn: string;
  checkOut: string;
  setCheckIn: (v: string) => void;
  setCheckOut: (v: string) => void;
  onSearch: () => void;
  loading: boolean;
  today: string;
  nightCount: number;
  t: TDict;
  lang: Lang;
  setLang: (l: Lang) => void;
  currency: string;
  setCurrency: (c: string) => void;
  rates: Record<string, number>;
  ratesLoading: boolean;
  showCurrencyMenu: boolean;
  setShowCurrencyMenu: (v: boolean) => void;
  onLogoClick: () => void;
}

export default function BookingNavbar({
  checkIn, checkOut, setCheckIn, setCheckOut, onSearch, loading, today,
  nightCount, t, lang, setLang, currency, setCurrency, rates, ratesLoading,
  showCurrencyMenu, setShowCurrencyMenu, onLogoClick
}: Props) {
  return (
    <div
      className="sticky top-0 z-40 border-b border-gray-800/60"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)' }}
    >
      {/* ── Fila 1: Logo + Moneda + Idioma ── */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between">
        {/* Logo */}
        <button onClick={onLogoClick} className="flex items-center gap-2 group">
          <div className="h-8 w-8 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-colors flex-shrink-0">
            <FaBed className="text-white text-xs" />
          </div>
          <div>
            <span className="font-bold text-sm text-white block leading-none">Palacio del Mar</span>
            <span className="text-emerald-400 text-xs">★ Premium</span>
          </div>
        </button>

        {/* Noches (solo desktop) + Moneda + Idioma */}
        <div className="flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <FaMoon className="text-emerald-400 text-xs" />
            <span className="font-medium text-white">{nightCount}</span>
            <span>{nightCount === 1 ? t.night : t.nights}</span>
          </span>

          <CurrencySelector
            currency={currency}
            setCurrency={setCurrency}
            rates={rates}
            ratesLoading={ratesLoading}
            showMenu={showCurrencyMenu}
            setShowMenu={setShowCurrencyMenu}
            rateRealtimeLabel={t.rateRealtime}
          />
          <LangSelector lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* ── Fila 2: Buscador de fechas (full width) ── */}
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-sm border border-gray-200 w-full">
          <FaCalendarAlt className="text-emerald-500 text-xs flex-shrink-0" />

          <input
            type="date"
            min={today}
            value={checkIn}
            onChange={e => setCheckIn(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none bg-transparent font-medium flex-1 min-w-0"
            style={{ maxWidth: '130px' }}
          />

          <FaArrowRight className="text-gray-300 text-xs flex-shrink-0" />

          <input
            type="date"
            min={checkIn || today}
            value={checkOut}
            onChange={e => setCheckOut(e.target.value)}
            className="text-sm text-gray-700 focus:outline-none bg-transparent font-medium flex-1 min-w-0"
            style={{ maxWidth: '130px' }}
          />

          {/* Noches (solo móvil, dentro del buscador) */}
          <span className="flex md:hidden items-center gap-1 text-xs text-gray-500 flex-shrink-0 border-l border-gray-200 pl-2">
            <FaMoon className="text-emerald-500 text-xs" />
            <span className="font-semibold text-gray-700">{nightCount}</span>
          </span>

          <button
            onClick={onSearch}
            disabled={loading}
            className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-60 shadow-md shadow-emerald-900/30 ml-auto"
          >
            <FaSearch className="text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}