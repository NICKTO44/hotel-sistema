import { useEffect, useState } from 'react';
import { reservationService, frontDeskService, roomService, Settings } from '../services/api';
import { Reservation, ReservationStatus, Room, RoomStatus } from '../types';
import { FaCheck, FaSignOutAlt, FaCalendarAlt, FaUser, FaBed, FaFileInvoiceDollar, FaFilePdf, FaTools, FaBroom, FaCheckCircle, FaClock, FaHourglassHalf, FaExclamationTriangle, FaPhoneAlt } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { generateInvoicePDF, generateDailyReportPDF } from '../utils/pdfExports';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

// ── Helpers ───────────────────────────────────────────────────────────────────
const getCheckoutStatus = (checkOutDate: string, checkoutHour = 11) => {
    const now      = new Date();
    const checkOut = new Date(checkOutDate);

    // Día de check-out con hora límite configurada
    const deadline = new Date(checkOut);
    deadline.setHours(checkoutHour, 0, 0, 0);

    const diffMs   = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const isOverdue  = now > deadline;
    const isToday    = !isOverdue && checkOut.toDateString() === now.toDateString();
    const isUrgent   = !isOverdue && isToday && diffMs < 2 * 60 * 60 * 1000; // menos de 2h

    return { isOverdue, isToday, isUrgent, diffDays };
};

// ── RoomCard ──────────────────────────────────────────────────────────────────
const RoomCard = ({ room }: { room: Room }) => {
    const { t } = useTranslation();

    const getStyle = (status: RoomStatus) => {
        switch (status) {
            case RoomStatus.Available:   return { bg: 'bg-emerald-600',  border: 'border-emerald-700', text: 'text-white', label: t('rooms.status.available') };
            case RoomStatus.Occupied:    return { bg: 'bg-gray-900',     border: 'border-black',       text: 'text-white', label: t('rooms.status.occupied') };
            case RoomStatus.Cleaning:    return { bg: 'bg-amber-500',    border: 'border-amber-600',   text: 'text-white', label: t('rooms.status.cleaning') };
            case RoomStatus.Maintenance: return { bg: 'bg-gray-500',     border: 'border-gray-600',    text: 'text-white', label: t('rooms.status.maintenance') };
            default:                     return { bg: 'bg-gray-300',     border: 'border-gray-400',    text: 'text-white', label: 'Unknown' };
        }
    };

    const getIcon = (status: RoomStatus) => {
        switch (status) {
            case RoomStatus.Available:   return <FaCheckCircle className="text-lg" />;
            case RoomStatus.Occupied:    return <FaBed className="text-lg" />;
            case RoomStatus.Cleaning:    return <FaBroom className="text-lg" />;
            case RoomStatus.Maintenance: return <FaTools className="text-lg" />;
            default:                     return <FaBed className="text-lg" />;
        }
    };

    const s = getStyle(room.status);

    return (
        <div
            className={`${s.bg} ${s.text} border-2 ${s.border} rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md`}
            title={`${room.roomTypeName || ''} · ${t('common.floor')} ${room.floor}`}
        >
            {getIcon(room.status)}
            <span className="font-black text-base leading-none">{room.number}</span>
            <span className="text-[9px] uppercase tracking-widest opacity-90 font-bold text-center leading-tight">
                {s.label}
            </span>
        </div>
    );
};

// ── ArrivalCard ───────────────────────────────────────────────────────────────
const ArrivalCard = ({
    reservation,
    onCheckIn,
    isProcessing
}: {
    reservation: Reservation;
    onCheckIn: () => void;
    isProcessing: boolean;
}) => {
    const { t } = useTranslation();
    const initials = reservation.guestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:border-emerald-200 hover:shadow-md transition-all duration-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-l-2xl" />
            <div className="pl-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white text-sm font-black flex-shrink-0 shadow-md shadow-emerald-200">
                            {initials}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                <FaUser className="text-xs text-emerald-500" />
                                {reservation.guestName}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <FaBed className="text-xs text-gray-300" />
                                {t('common.room')} <span className="font-semibold text-gray-600">{reservation.roomNumber}</span>
                            </p>
                        </div>
                    </div>
                    {reservation.status === ReservationStatus.Confirmed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FaCheckCircle className="text-xs" />
                            {t('reservations.status.confirmed')}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <FaClock className="text-xs" />
                            {t('reservations.status.pending')}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                    <FaCalendarAlt className="text-emerald-500 text-xs" />
                    {new Date(reservation.checkInDate).toLocaleDateString()}
                </div>
                <button
                    onClick={onCheckIn}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.35)' }}
                >
                    {isProcessing ? (
                        <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.loading')}</>
                    ) : (
                        <><FaCheck className="text-xs" />{t('frontDesk.checkIn')}</>
                    )}
                </button>
            </div>
        </div>
    );
};

// ── DepartureCard ─────────────────────────────────────────────────────────────
const DepartureCard = ({
    reservation,
    onCheckOut,
    onInvoice,
    isProcessing,
    checkoutHour,
}: {
    reservation: Reservation;
    onCheckOut: () => void;
    onInvoice: () => void;
    isProcessing: boolean;
    checkoutHour: number;
}) => {
    const { t } = useTranslation();
    const initials = reservation.guestName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const { isOverdue, isToday, isUrgent, diffDays } = getCheckoutStatus(reservation.checkOutDate, checkoutHour);

    // ── Estilos dinámicos según estado ───────────────────────────────────────
    const cardBorder  = isOverdue ? 'border-2 border-red-400 shadow-red-100 shadow-md' : 'border border-gray-100 hover:border-gray-300 hover:shadow-md';
    const accentColor = isOverdue ? 'bg-gradient-to-b from-red-400 to-red-600' : 'bg-gradient-to-b from-gray-700 to-black';
    const avatarBg    = isOverdue ? 'bg-red-600' : 'bg-gray-900';

    return (
        <div className={`bg-white rounded-2xl p-4 transition-all duration-200 relative overflow-hidden ${cardBorder}`}>

            {/* ── Pulso rojo si vencida ── */}
            {isOverdue && (
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full z-10">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    Llamar al huésped
                </div>
            )}

            {/* Acento lateral */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${accentColor} rounded-l-2xl`} />

            <div className="pl-3">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${avatarBg} flex items-center justify-center text-white text-sm font-black flex-shrink-0`}>
                            {initials}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{reservation.guestName}</p>
                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                <FaBed className="text-xs text-gray-300" />
                                {t('common.room')} <span className="font-semibold text-gray-600">{reservation.roomNumber}</span>
                            </p>
                        </div>
                    </div>

                    {/* Badge de estado — esquina inferior derecha para no chocar con el botón "Llamar" */}
                    <div className="mt-8">
                        {isOverdue ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                                <FaExclamationTriangle className="text-xs" />Vencido
                            </span>
                        ) : isUrgent ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-200">
                                <FaClock className="text-xs" />Urgente
                            </span>
                        ) : isToday ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                <FaClock className="text-xs" />Hoy
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                <FaHourglassHalf className="text-xs" />{diffDays}d
                            </span>
                        )}
                    </div>
                </div>

                {/* Mensaje de alerta si vencida */}
                {isOverdue && (
                    <div className="mb-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2 flex items-center gap-2">
                        <FaPhoneAlt className="text-red-500 text-xs flex-shrink-0" />
                        <p className="text-xs text-red-600 font-medium">
                            Check-out vencido. Contactar al huésped para confirmar si amplía o desocupa.
                        </p>
                    </div>
                )}

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 bg-gray-50 px-3 py-1.5 rounded-lg w-fit">
                    <FaCalendarAlt className="text-gray-400 text-xs" />
                    {t('frontDesk.checkOut')}: <span className="font-semibold text-gray-600 ml-1">{new Date(reservation.checkOutDate).toLocaleDateString()}</span>
                    {isOverdue && <span className="text-red-500 font-bold ml-1">· {checkoutHour}:00 am límite</span>}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={onInvoice}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 transition-all"
                    >
                        <FaFileInvoiceDollar className="text-xs text-emerald-600" />
                        {t('reservations.actions.viewInvoice')}
                    </button>
                    <button
                        onClick={onCheckOut}
                        disabled={isProcessing}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 ${isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-900 hover:bg-black'}`}
                        style={{ boxShadow: isOverdue ? '0 4px 12px rgba(220,38,38,0.3)' : '0 4px 12px rgba(0,0,0,0.2)' }}
                    >
                        {isProcessing ? (
                            <><div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('common.loading')}</>
                        ) : (
                            <><FaSignOutAlt className="text-xs" />{t('frontDesk.checkOut')}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ── Banner de alertas vencidas ─────────────────────────────────────────────────
const OverdueBanner = ({ count, names }: { count: number; names: string[] }) => {
    if (count === 0) return null;
    return (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-start gap-3 animate-pulse-once">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <FaExclamationTriangle className="text-red-500 text-lg" />
            </div>
            <div>
                <p className="font-black text-red-700 text-sm">
                    {count === 1 ? '1 huésped con check-out vencido' : `${count} huéspedes con check-out vencido`}
                </p>
                <p className="text-xs text-red-500 mt-0.5">
                    {names.join(', ')} — Contactar para confirmar ampliación o salida inmediata.
                </p>
            </div>
        </div>
    );
};

// ── DEFAULT SETTINGS ──────────────────────────────────────────────────────────
const DEFAULT_SETTINGS: Settings = {
    id: '',
    companyName: 'Hotel Sistema',
    documentNumber: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logoBase64: null,
    currency: 'PEN',
    currencySymbol: 'S/',
    timeZone: 'America/Lima',
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    language: 'es',
    sessionTimeout: 60,
    createdAt: '',
    updatedAt: '',
};

// ── FrontDesk ─────────────────────────────────────────────────────────────────
const FrontDesk = () => {
    const { t } = useTranslation();
    const { data: settings } = useSettings();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [rooms, setRooms]               = useState<Room[]>([]);
    const [loading, setLoading]           = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: 'checkin' | 'checkout'; id: string; name: string } | null>(null);

    // Hora de check-out desde settings (default 11)
    const checkoutHour = 11; // Hora de check-out configurada en Settings

    useEffect(() => { fetchData(); }, []);

    // Auto-refresh cada 5 minutos para detectar nuevos vencimientos
    useEffect(() => {
        const interval = setInterval(fetchData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resData, roomsData] = await Promise.all([
                reservationService.getAll(),
                roomService.getAll(),
            ]);
            setReservations(resData);
            setRooms(roomsData);
        } catch {
            showErrorToast(t('frontDesk.loadError'));
        } finally {
            setLoading(false);
        }
    };

    const executeCheckIn = async () => {
        if (!confirmAction) return;
        setProcessingId(confirmAction.id);
        setConfirmAction(null);
        try {
            await frontDeskService.checkIn(confirmAction.id);
            await fetchData();
            showSuccessToast(t('frontDesk.checkInSuccess'));
        } catch (error: any) {
            showErrorToast(t('frontDesk.checkInError') + ': ' + (error.response?.data || error.message));
        } finally { setProcessingId(null); }
    };

    const executeCheckOut = async () => {
        if (!confirmAction) return;
        setProcessingId(confirmAction.id);
        setConfirmAction(null);
        try {
            await frontDeskService.checkOut(confirmAction.id);
            await fetchData();
            showSuccessToast(t('frontDesk.checkOutSuccess'));
        } catch (error: any) {
            showErrorToast(t('frontDesk.checkOutError') + ': ' + (error.response?.data || error.message));
        } finally { setProcessingId(null); }
    };

    const pendingCheckIns = reservations.filter(r =>
        r.status === ReservationStatus.Confirmed || r.status === ReservationStatus.Pending
    );
    const activeStays = reservations.filter(r => r.status === ReservationStatus.CheckedIn);

    // Separar vencidas para mostrarlas primero
    const overdueStays = activeStays.filter(r => getCheckoutStatus(r.checkOutDate, checkoutHour).isOverdue);
    const normalStays  = activeStays.filter(r => !getCheckoutStatus(r.checkOutDate, checkoutHour).isOverdue);
    const sortedStays  = [...overdueStays, ...normalStays];

    return (
        <div className="space-y-6 p-1">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight">{t('frontDesk.title')}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{t('frontDesk.subtitle')}</p>
                </div>
                <button
                    onClick={() => settings && generateDailyReportPDF(reservations, rooms, settings)}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: 'linear-gradient(135deg, #111827 0%, #000000 100%)', boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }}
                >
                    <FaFilePdf className="text-red-400 text-xs" />
                    {t('frontDesk.dailyReport')}
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
                    <p className="text-sm text-gray-400 font-medium">Cargando...</p>
                </div>
            ) : (
                <>
                    {/* ── Banner de alertas vencidas ── */}
                    <OverdueBanner
                        count={overdueStays.length}
                        names={overdueStays.map(r => r.guestName)}
                    />

                    {/* ── Room Rack ── */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 rounded-t-2xl" />
                        <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2 mt-1">
                            <div className="w-1 h-5 bg-emerald-600 rounded-full" />
                            {t('frontDesk.liveRoomRack')}
                        </h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                            {rooms
                                .sort((a, b) => a.number.localeCompare(b.number))
                                .map(room => <RoomCard key={room.id} room={room} />)
                            }
                        </div>
                        <div className="flex gap-5 mt-5 flex-wrap border-t border-gray-100 pt-4">
                            {[
                                { color: 'bg-emerald-600', label: t('rooms.status.available') },
                                { color: 'bg-gray-900',    label: t('rooms.status.occupied') },
                                { color: 'bg-amber-500',   label: t('rooms.status.cleaning') },
                                { color: 'bg-gray-500',    label: t('rooms.status.maintenance') },
                            ].map(({ color, label }) => (
                                <div key={label} className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <div className={`h-3 w-3 rounded-md ${color}`} />
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Arrivals & Active Stays ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Llegadas */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-emerald-600 rounded-full" />
                                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    {t('frontDesk.incomingArrivals')}
                                </h2>
                                <span className="ml-auto bg-emerald-100 text-emerald-700 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-200">
                                    {pendingCheckIns.length}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {pendingCheckIns.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                                        <FaCalendarAlt className="text-3xl text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400 font-medium">{t('frontDesk.noPendingArrivals')}</p>
                                    </div>
                                ) : (
                                    pendingCheckIns.map(res => (
                                        <ArrivalCard
                                            key={res.id}
                                            reservation={res}
                                            onCheckIn={() => setConfirmAction({ type: 'checkin', id: res.id, name: res.guestName })}
                                            isProcessing={processingId === res.id}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Estadías activas */}
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="w-1 h-6 bg-gray-900 rounded-full" />
                                <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                    {t('frontDesk.activeStays')}
                                </h2>
                                <span className="ml-auto bg-gray-900 text-white text-xs font-black px-2.5 py-1 rounded-full">
                                    {activeStays.length}
                                </span>
                                {overdueStays.length > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <FaExclamationTriangle className="text-xs" />
                                        {overdueStays.length} vencida{overdueStays.length > 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {activeStays.length === 0 ? (
                                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                                        <FaBed className="text-3xl text-gray-200 mx-auto mb-3" />
                                        <p className="text-sm text-gray-400 font-medium">{t('frontDesk.noActiveStays')}</p>
                                    </div>
                                ) : (
                                    sortedStays.map(res => (
                                        <DepartureCard
                                            key={res.id}
                                            reservation={res}
                                            onCheckOut={() => setConfirmAction({ type: 'checkout', id: res.id, name: res.guestName })}
                                            onInvoice={() => generateInvoicePDF(res, settings ?? DEFAULT_SETTINGS)}
                                            isProcessing={processingId === res.id}
                                            checkoutHour={checkoutHour}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                onConfirm={confirmAction?.type === 'checkin' ? executeCheckIn : executeCheckOut}
                title={confirmAction?.type === 'checkin' ? t('frontDesk.checkIn') : t('frontDesk.checkOut')}
                message={confirmAction
                    ? (confirmAction.type === 'checkin' ? t('frontDesk.confirmCheckIn') : t('frontDesk.confirmCheckOut')) + ' ' + confirmAction.name + '?'
                    : ''}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
                type={confirmAction?.type === 'checkout' ? 'warning' : 'info'}
            />
        </div>
    );
};

export default FrontDesk;