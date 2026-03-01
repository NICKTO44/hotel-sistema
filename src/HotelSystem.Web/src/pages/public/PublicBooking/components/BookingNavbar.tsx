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
    <div className="sticky top-0 z-40 border-b border-gray-800/60"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 50%, #0a0a0a 100%)' }}>
      <div className="px-4 md:px-6 py-3 flex items-center gap-3">
        {/* Logo */}
        <button onClick={onLogoClick} className="flex items-center gap-2 flex-shrink-0 group">
          <div className="h-9 w-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg group-hover:bg-emerald-500 transition-colors">
            <FaBed className="text-white text-xs" />
          </div>
          <div className="hidden md:block">
            <span className="font-bold text-sm text-white block leading-none">Palacio del Mar</span>
            <span className="text-emerald-400 text-xs">★ Premium</span>
          </div>
        </button>

        {/* Buscador de fechas */}
        <div className="flex items-center gap-2 bg-white/95 rounded-xl px-3 py-2 shadow-sm flex-1 max-w-md border border-gray-200">
          <FaCalendarAlt className="text-emerald-500 text-xs flex-shrink-0" />
          <input
            type="date" min={today} value={checkIn}
            onChange={e => { setCheckIn(e.target.value); }}
            className="text-sm text-gray-700 focus:outline-none bg-transparent flex-1 min-w-0 font-medium"
          />
          <FaArrowRight className="text-gray-300 text-xs flex-shrink-0" />
          <input
            type="date" min={checkIn || today} value={checkOut}
            onChange={e => { setCheckOut(e.target.value); }}
            className="text-sm text-gray-700 focus:outline-none bg-transparent flex-1 min-w-0 font-medium"
          />
          <button
            onClick={onSearch}
            disabled={loading}
            className="h-7 w-7 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-60 shadow-md shadow-emerald-900/30"
          >
            <FaSearch className="text-xs" />
          </button>
        </div>

        {/* Noches */}
        <span className="hidden md:flex items-center gap-1.5 text-sm text-gray-400 flex-shrink-0 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
          <FaMoon className="text-emerald-400 text-xs" />
          <span className="font-medium text-white">{nightCount}</span>
          <span>{nightCount === 1 ? t.night : t.nights}</span>
        </span>

        {/* Moneda + Idioma */}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
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
    </div>
  );
}