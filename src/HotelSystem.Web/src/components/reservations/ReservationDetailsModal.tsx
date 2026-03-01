import { Reservation, ReservationStatus } from '../../services/api';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import { FaTimes, FaUser, FaBed, FaCalendarAlt, FaUsers, FaChild, FaStickyNote } from 'react-icons/fa';
import { Link } from 'react-router-dom';

interface ReservationDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservation: Reservation | null;
}

const ReservationDetailsModal = ({ isOpen, onClose, reservation }: ReservationDetailsModalProps) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();

    if (!isOpen || !reservation) return null;

    const getStatusStyle = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.Pending:    return 'bg-amber-50 text-amber-700 border-amber-200';
            case ReservationStatus.Confirmed:  return 'bg-blue-50 text-blue-700 border-blue-200';
            case ReservationStatus.CheckedIn:  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case ReservationStatus.CheckedOut: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
            case ReservationStatus.Cancelled:  return 'bg-red-50 text-red-600 border-red-200';
            default: return 'bg-neutral-100 text-neutral-600 border-neutral-200';
        }
    };

    const getStatusLabel = (status: ReservationStatus) => {
        const labels: Record<number, string> = {
            [ReservationStatus.Pending]:    t('reservations.status.pending'),
            [ReservationStatus.Confirmed]:  t('reservations.status.confirmed'),
            [ReservationStatus.CheckedIn]:  t('reservations.status.checkedIn'),
            [ReservationStatus.CheckedOut]: t('reservations.status.checkedOut'),
            [ReservationStatus.Cancelled]:  t('reservations.status.cancelled'),
        };
        return labels[status] || 'Unknown';
    };

    const nights = Math.ceil(
        (new Date(reservation.checkOutDate).getTime() - new Date(reservation.checkInDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl shadow-xl overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-900">
                            {t('reservations.detailsTitle', 'Detalles de Reservación')}
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">ID: {reservation.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">

                    {/* Status & Total */}
                    <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                        <span className={`inline-flex px-3 py-1 rounded text-sm font-medium border ${getStatusStyle(reservation.status)}`}>
                            {getStatusLabel(reservation.status)}
                        </span>
                        <div className="text-right">
                            <p className="text-xs text-neutral-400 uppercase tracking-wide">{t('reservations.totalPrice')}</p>
                            <p className="text-2xl font-bold text-neutral-900">{formatCurrency(reservation.totalPrice)}</p>
                        </div>
                    </div>

                    {/* Guest & Room */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <FaUser className="text-xs" />{t('reservations.guest')}
                            </p>
                            <Link
                                to={`/guests?search=${reservation.guestName}`}
                                className="font-semibold text-emerald-600 hover:underline text-sm block mb-2"
                            >
                                {reservation.guestName}
                            </Link>
                            <div className="flex gap-4 text-sm text-neutral-600">
                                <span className="flex items-center gap-1">
                                    <FaUsers className="text-xs text-neutral-400" />
                                    {reservation.adults} {t('reservations.fields.adults')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <FaChild className="text-xs text-neutral-400" />
                                    {reservation.children} {t('reservations.fields.children')}
                                </span>
                            </div>
                        </div>

                        <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <FaBed className="text-xs" />{t('reservations.room')}
                            </p>
                            <p className="font-semibold text-neutral-900 text-sm mb-1">
                                {t('common.room')} {reservation.roomNumber}
                            </p>
                            <p className="text-sm text-neutral-500">
                                {nights} {nights === 1 ? 'noche' : 'noches'}
                            </p>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="bg-neutral-50 rounded-lg p-4 border border-neutral-100">
                        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <FaCalendarAlt className="text-xs" />Fechas
                        </p>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-neutral-400 mb-0.5">{t('reservations.checkIn')}</p>
                                <p className="font-semibold text-neutral-800 text-sm">
                                    {new Date(reservation.checkInDate).toLocaleDateString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="h-px flex-1 mx-4 bg-neutral-200" />
                            <div className="text-right">
                                <p className="text-xs text-neutral-400 mb-0.5">{t('reservations.checkOut')}</p>
                                <p className="font-semibold text-neutral-800 text-sm">
                                    {new Date(reservation.checkOutDate).toLocaleDateString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {reservation.notes && (
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <FaStickyNote className="text-xs" />{t('reservations.notes', 'Notas')}
                            </p>
                            <p className="text-sm text-neutral-700">{reservation.notes}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReservationDetailsModal;