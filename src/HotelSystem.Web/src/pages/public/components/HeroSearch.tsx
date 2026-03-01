import { useState, useEffect, useRef } from 'react';
import { FaSearch, FaCalendarAlt, FaCheck, FaShieldAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

interface HeroSearchProps {
    onSearch: (checkIn: string, checkOut: string) => Promise<void>;
    loading: boolean;
}

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

// Reemplaza estas rutas con tus imágenes reales en /public/images/hero/
const SLIDES = [
    { src: '/images/hero/hero1.avif', alt: 'Vista del hotel' },
    { src: '/images/hero/hero2.jpg', alt: 'Habitación deluxe' },
    { src: '/images/hero/hero3.webp', alt: 'Piscina y jardines' },
    { src: '/images/hero/hero4.jpg', alt: 'Restaurante' },
];

const HeroSearch = ({ onSearch, loading }: HeroSearchProps) => {
    const [checkIn, setCheckIn] = useState(today);
    const [checkOut, setCheckOut] = useState(tomorrow);
    const [error, setError] = useState('');
    const [current, setCurrent] = useState(0);
    const [animating, setAnimating] = useState(true);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const goTo = (index: number) => {
        setCurrent(index);
        setAnimating(false);
        setTimeout(() => setAnimating(true), 50);
    };

    const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
    const next = () => goTo((current + 1) % SLIDES.length);

    useEffect(() => {
        intervalRef.current = setInterval(() => {
            setCurrent(c => (c + 1) % SLIDES.length);
            setAnimating(false);
            setTimeout(() => setAnimating(true), 50);
        }, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    const handleSearch = async () => {
        if (!checkIn || !checkOut || checkIn >= checkOut) {
            setError('La fecha de salida debe ser posterior a la de entrada.');
            return;
        }
        setError('');
        await onSearch(checkIn, checkOut);
    };

    return (
        <div>
            {/* ── HERO ── */}
            <div className="relative h-screen min-h-[600px] overflow-hidden">

                {/* Carrusel de imágenes con Ken Burns */}
                {SLIDES.map((slide, i) => (
                    <div
                        key={slide.src}
                        className="absolute inset-0 transition-opacity duration-1000"
                        style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
                    >
                        <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-full object-cover"
                            style={{
                                animation: i === current && animating
                                    ? 'kenBurns 7s ease-in-out forwards'
                                    : 'none',
                            }}
                        />
                    </div>
                ))}

                {/* Overlay oscuro para legibilidad */}
                <div className="absolute inset-0 bg-black/45 z-10" />

                {/* Contenido centrado */}
                <div className="relative z-20 flex flex-col items-center justify-center h-full px-6 text-center pb-16">
                    <span className="inline-block text-emerald-300 text-xs font-bold tracking-widest uppercase mb-5 border border-emerald-400/40 bg-emerald-950/40 backdrop-blur-sm px-4 py-1.5 rounded-full">
                        Reserva directa · Sin comisiones
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 leading-tight drop-shadow-xl max-w-3xl">
                        Encuentra tu habitación perfecta
                    </h1>
                    <p className="text-white/70 text-lg mb-10 max-w-xl">
                        Consulta disponibilidad en tiempo real y reserva en minutos
                    </p>

                    {/* Search box flotante */}
                    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 md:p-5 w-full max-w-2xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                            <div className="text-left">
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                                    <FaCalendarAlt className="inline mr-1 text-emerald-500" />Check-in
                                </label>
                                <input
                                    type="date"
                                    min={today}
                                    value={checkIn}
                                    onChange={e => { setCheckIn(e.target.value); setError(''); }}
                                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="text-left">
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">
                                    <FaCalendarAlt className="inline mr-1 text-emerald-500" />Check-out
                                </label>
                                <input
                                    type="date"
                                    min={checkIn || today}
                                    value={checkOut}
                                    onChange={e => { setCheckOut(e.target.value); setError(''); }}
                                    className="w-full px-3 py-2.5 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors disabled:opacity-60 text-sm h-[42px]"
                            >
                                <FaSearch />
                                {loading ? 'Buscando...' : 'Buscar'}
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-3 text-center">{error}</p>}
                    </div>
                </div>

                {/* Flechas de navegación */}
                <button
                    onClick={prev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                >
                    <FaChevronLeft />
                </button>
                <button
                    onClick={next}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-20 h-10 w-10 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-colors"
                >
                    <FaChevronRight />
                </button>

                {/* Dots */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => goTo(i)}
                            className={`rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'bg-white w-6 h-2'
                                    : 'bg-white/40 hover:bg-white/60 w-2 h-2'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Keyframes Ken Burns — inyectados como style tag */}
            <style>{`
                @keyframes kenBurns {
                    0%   { transform: scale(1)    translate(0, 0); }
                    100% { transform: scale(1.08) translate(-1%, -1%); }
                }
            `}</style>

            {/* ── FEATURES ── */}
            <div className="max-w-4xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                {[
                    { icon: FaCalendarAlt, title: 'Disponibilidad en tiempo real', desc: 'Ve exactamente qué habitaciones están libres para tus fechas' },
                    { icon: FaShieldAlt,   title: 'Reserva segura',               desc: 'Tu reserva queda confirmada inmediatamente en nuestro sistema' },
                    { icon: FaCheck,       title: 'Sin intermediarios',            desc: 'Reserva directo con el hotel, sin comisiones ni sobrecargos' },
                ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="flex flex-col items-center gap-3">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <Icon className="text-emerald-600 text-lg" />
                        </div>
                        <h3 className="font-semibold text-neutral-900 text-sm">{title}</h3>
                        <p className="text-neutral-500 text-sm leading-relaxed">{desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HeroSearch;