import { useEffect, useRef, useState } from 'react';
import { FaCalendarAlt, FaSearch, FaChevronLeft, FaChevronRight, FaShieldAlt, FaCheck } from 'react-icons/fa';
import { SLIDES, TDict, Lang } from '../constants';
import LangSelector from './LangSelector';

interface Props {
  checkIn: string;
  checkOut: string;
  setCheckIn: (v: string) => void;
  setCheckOut: (v: string) => void;
  loading: boolean;
  error: string;
  onSearch: () => void;
  today: string;
  t: TDict;
  lang: Lang;
  setLang: (l: Lang) => void;
}

export default function HeroStep({
  checkIn, checkOut, setCheckIn, setCheckOut,
  loading, error, onSearch, today, t, lang, setLang
}: Props) {
  const [current, setCurrent] = useState(0);
  const [kenKey, setKenKey] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => { setCurrent(index); setKenKey(k => k + 1); };
  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % SLIDES.length);
      setKenKey(k => k + 1);
    }, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&display=swap');

        @keyframes kenBurns {
          0%   { transform: scale(1) translate(0px, 0px); }
          100% { transform: scale(1.07) translate(-8px, -5px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .ken-burns { animation: kenBurns 7s cubic-bezier(0.25,0.46,0.45,0.94) forwards; }
        .fade-up-1 { animation: fadeUp 0.8s ease forwards; }
        .fade-up-2 { animation: fadeUp 0.8s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.8s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.8s 0.45s ease both; }
        .shimmer   { animation: shimmer 2.5s ease-in-out infinite; }

        .booking-font { font-family: 'DM Sans', sans-serif; }
        .hero-title   { font-family: 'Playfair Display', serif; }

        .glass-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255,255,255,0.25);
        }
        .green-glow {
          box-shadow: 0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.1);
        }
        .date-input-custom::-webkit-calendar-picker-indicator {
          opacity: 0.6;
          cursor: pointer;
          filter: invert(1);
        }
        .glass-input {
          background: rgba(255,255,255,0.15);
          border: 1.5px solid rgba(255,255,255,0.25);
          color: white;
          transition: all 0.2s ease;
        }
        .glass-input:focus {
          background: rgba(255,255,255,0.22);
          border-color: rgba(52,211,153,0.7);
          outline: none;
          box-shadow: 0 0 0 3px rgba(52,211,153,0.15);
        }
        .glass-label { color: rgba(255,255,255,0.7); }
        .glass-input::placeholder { color: rgba(255,255,255,0.4); }
        .glass-input::-webkit-datetime-edit { color: white; }
        .glass-input::-webkit-datetime-edit-fields-wrapper { color: white; }
        .glass-input::-webkit-datetime-edit-text { color: rgba(255,255,255,0.5); }
        .feat-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(240,253,244,0.9) 100%);
          border: 1px solid rgba(16,185,129,0.15);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        .feat-card:hover {
          transform: translateY(-4px);
          border-color: rgba(16,185,129,0.4);
          box-shadow: 0 12px 40px rgba(16,185,129,0.15);
        }
        .search-btn {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 15px rgba(5,150,105,0.4);
          transition: all 0.2s ease;
        }
        .search-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(5,150,105,0.5);
        }
        .search-btn:active:not(:disabled) { transform: translateY(0); }
      `}</style>

      {/* ── Navbar sobre el hero ── */}
      <header className="absolute top-0 left-0 right-0 z-50 px-4 md:px-10 py-4 flex items-center justify-between booking-font">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center">
          <span
            className="font-bold text-white drop-shadow leading-none"
            style={{ fontSize: '1.15rem', fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: '-0.01em' }}
          >
            Palacio<span style={{ color: '#34d399' }}> del Mar</span>
          </span>
        </div>
        <div className="relative">
          <LangSelector lang={lang} setLang={setLang} />
        </div>
      </header>

      {/* ── Slider ── */}
      <div className="relative h-screen min-h-[600px] overflow-hidden">
        {SLIDES.map((slide, i) => (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <img
              key={i === current ? kenKey : undefined}
              src={slide.src}
              alt={slide.alt}
              className={`w-full h-full object-cover ${i === current ? 'ken-burns' : ''}`}
            />
          </div>
        ))}

        <div className="absolute inset-0 z-10" style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 100%)'
        }} />

        {/* Contenido central */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 md:px-6 text-center pt-20 booking-font">

          {/* Badge */}
          <div className="fade-up-1 mb-4 md:mb-6">
            <span className="inline-flex items-center gap-2 text-white text-xs font-semibold tracking-widest uppercase border border-emerald-400/50 bg-emerald-600/20 backdrop-blur-md px-4 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shimmer inline-block"></span>
              {t.badge}
            </span>
          </div>

          {/* Título */}
          <h1 className="fade-up-2 hero-title text-4xl sm:text-5xl md:text-7xl font-black text-white mb-4 md:mb-5 leading-tight drop-shadow-2xl max-w-4xl px-2">
            {t.heroTitle}
          </h1>
          <p className="fade-up-3 text-white/75 text-base md:text-xl mb-8 md:mb-12 max-w-xl font-light tracking-wide px-2">
            {t.heroSub}
          </p>

          {/* Search card */}
          <div className="fade-up-4 glass-card green-glow rounded-2xl p-4 md:p-6 w-full max-w-2xl">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">

              <div className="text-left flex-1">
                <label className="glass-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2">
                  <FaCalendarAlt className="text-emerald-400" />{t.checkin}
                </label>
                <input
                  type="date" min={today} value={checkIn}
                  onChange={e => setCheckIn(e.target.value)}
                  className="date-input-custom glass-input w-full px-3 py-2.5 rounded-xl text-sm font-medium"
                />
              </div>

              <div className="text-left flex-1">
                <label className="glass-label flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-2">
                  <FaCalendarAlt className="text-emerald-400" />{t.checkout}
                </label>
                <input
                  type="date" min={checkIn || today} value={checkOut}
                  onChange={e => setCheckOut(e.target.value)}
                  className="date-input-custom glass-input w-full px-3 py-2.5 rounded-xl text-sm font-medium"
                />
              </div>

              <button
                onClick={onSearch}
                disabled={loading}
                className="search-btn flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-xl disabled:opacity-60 text-sm h-[46px] sm:h-[50px] w-full sm:w-auto flex-shrink-0"
              >
                <FaSearch />{loading ? t.searching : t.search}
              </button>
            </div>

            {error && (
              <p className="text-xs mt-3 text-center rounded-lg py-2 px-3" style={{ background: 'rgba(239,68,68,0.15)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.3)' }}>
                ⚠ {error}
              </p>
            )}
          </div>
        </div>

        {/* Controles slider */}
        <button onClick={prev}
          className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full items-center justify-center transition-all hover:scale-110 border border-white/20">
          <FaChevronLeft />
        </button>
        <button onClick={next}
          className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white rounded-full items-center justify-center transition-all hover:scale-110 border border-white/20">
          <FaChevronRight />
        </button>

        {/* Dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all duration-400 ${i === current ? 'bg-emerald-400 w-6 h-2' : 'bg-white/40 hover:bg-white/70 w-2 h-2'}`}
            />
          ))}
        </div>
      </div>

      {/* ── Features section ── */}
      <div className="booking-font overflow-x-hidden" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-emerald-600 text-xs font-bold tracking-widest uppercase mb-3">¿Por qué elegirnos?</p>
            <h2 className="hero-title text-2xl md:text-4xl font-bold text-gray-900">
              La experiencia más simple y segura
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-8">
            {[
              { icon: FaCalendarAlt, title: t.feat1Title, desc: t.feat1Desc, num: '01' },
              { icon: FaShieldAlt,   title: t.feat2Title, desc: t.feat2Desc, num: '02' },
              { icon: FaCheck,       title: t.feat3Title, desc: t.feat3Desc, num: '03' },
            ].map(({ icon: Icon, title, desc, num }) => (
              <div key={title} className="feat-card rounded-2xl p-6 md:p-8 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="h-12 w-12 md:h-14 md:w-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200">
                    <Icon className="text-white text-lg md:text-xl" />
                  </div>
                  <span className="hero-title text-4xl md:text-5xl font-black text-emerald-100 leading-none">{num}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base md:text-lg leading-snug">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}