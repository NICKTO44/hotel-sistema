import { useRef, useEffect } from 'react';
import { FaGlobe, FaSpinner } from 'react-icons/fa';
import { CURRENCIES } from '../constants';

interface Props {
  currency: string;
  setCurrency: (code: string) => void;
  rates: Record<string, number>;
  ratesLoading: boolean;
  showMenu: boolean;
  setShowMenu: (v: boolean) => void;
  rateRealtimeLabel: string;
}

export default function CurrencySelector({
  currency, setCurrency, rates, ratesLoading, showMenu, setShowMenu, rateRealtimeLabel
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedCur = CURRENCIES.find(c => c.code === currency)!;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [setShowMenu]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-sm px-3 py-1.5 rounded-lg transition-all border border-white/10 hover:border-white/25 backdrop-blur-sm"
      >
        {ratesLoading
          ? <FaSpinner className="animate-spin text-xs text-emerald-400" />
          : <FaGlobe className="text-xs text-emerald-400" />
        }
        <span className="font-semibold tracking-wide">{selectedCur.code}</span>
        <svg className="w-3 h-3 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-50 min-w-[170px] overflow-hidden">
          {CURRENCIES.map(cur => (
            <button
              key={cur.code}
              onClick={() => { setCurrency(cur.code); setShowMenu(false); }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                currency === cur.code
                  ? 'text-emerald-700 font-bold bg-emerald-50'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{cur.name}</span>
              <span className="text-xs font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">{cur.code}</span>
            </button>
          ))}
          {Object.keys(rates).length > 0 && (
            <p className="text-xs text-gray-400 text-center py-2 border-t border-gray-100 bg-gray-50">
              🔄 {rateRealtimeLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
}