import { Reservation, ReservationStatus } from '../../services/api';
import { FaUser, FaBed, FaUsers, FaChild, FaFileInvoiceDollar, FaEdit, FaTimesCircle, FaEye, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import { Link } from 'react-router-dom';

interface ReservationCardProps {
    reservation: Reservation;
    onViewInvoice: () => void;
    onCancel: () => void;
    onEdit: () => void;
    onViewDetails: () => void;
}

const isOverdue = (reservation: Reservation) => {
    if (reservation.status !== ReservationStatus.CheckedIn) return false;
    const deadline = new Date(reservation.checkOutDate);
    deadline.setHours(11, 0, 0, 0);
    return new Date() > deadline;
};

const StatusBadge = ({ status }: { status: ReservationStatus }) => {
    const { t } = useTranslation();
    const map: Record<number, { label: string; cls: string }> = {
        [ReservationStatus.Pending]:    { label: t('reservations.status.pending'),    cls: 'bg-amber-50 text-amber-700 border-amber-200' },
        [ReservationStatus.Confirmed]:  { label: t('reservations.status.confirmed'),  cls: 'bg-blue-50 text-blue-700 border-blue-200' },
        [ReservationStatus.CheckedIn]:  { label: t('reservations.status.checkedIn'),  cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        [ReservationStatus.CheckedOut]: { label: t('reservations.status.checkedOut'), cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' },
        [ReservationStatus.Cancelled]:  { label: t('reservations.status.cancelled'),  cls: 'bg-red-50 text-red-600 border-red-200' },
    };
    const s = map[status] || { label: 'Unknown', cls: 'bg-neutral-100 text-neutral-600 border-neutral-200' };
    return (
        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${s.cls}`}>
            {s.label}
        </span>
    );
};

const ReservationCard = ({ reservation, onViewInvoice, onCancel, onEdit, onViewDetails }: ReservationCardProps) => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const overdue = isOverdue(reservation);

    const checkIn  = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    const nights   = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const initials = (reservation.guestName || 'G')
        .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div className={`bg-white rounded-lg p-4 transition-all relative ${
            overdue
                ? 'border-2 border-red-400 shadow-md shadow-red-100'
                : 'border border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
        }`}>

            {/* Badge vencido */}
            {overdue && (
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    <FaExclamationTriangle className="text-xs" />
                    Vencido
                </div>
            )}

            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 ${overdue ? 'bg-red-500' : 'bg-neutral-900'}`}>
                        {initials}
                    </div>
                    <div>
                        <Link
                            to={`/guests?search=${reservation.guestName}`}
                            className="font-semibold text-neutral-900 text-sm hover:text-emerald-600 transition-colors flex items-center gap-1"
                        >
                            <FaUser className="text-xs text-neutral-400" />
                            {reservation.guestName}
                        </Link>
                        <div className="flex items-center gap-1 text-xs text-neutral-500 mt-0.5">
                            <FaBed className="text-xs" />
                            {t('common.room')} {reservation.roomNumber}
                        </div>
                    </div>
                </div>
                {!overdue && <StatusBadge status={reservation.status} />}
            </div>

            {/* Dates */}
            <div className={`border rounded-md p-3 mb-3 ${overdue ? 'bg-red-50 border-red-100' : 'bg-neutral-50 border-neutral-100'}`}>
                <div className="flex items-center justify-between text-xs">
                    <div>
                        <p className="text-neutral-400 font-medium uppercase tracking-wide mb-0.5">{t('reservations.checkIn')}</p>
                        <p className="font-semibold text-neutral-800">{checkIn.toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1 text-neutral-500">
                        <FaClock className="text-xs" />
                        <span className="font-medium">{nights} {nights === 1 ? 'noche' : 'noches'}</span>
                    </div>
                    <div className="text-right">
                        <p className="text-neutral-400 font-medium uppercase tracking-wide mb-0.5">{t('reservations.checkOut')}</p>
                        <p className={`font-semibold ${overdue ? 'text-red-600' : 'text-neutral-800'}`}>
                            {checkOut.toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Guests info */}
            <div className="flex items-center gap-3 mb-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                    <FaUsers className="text-xs" /> {reservation.adults} {t('reservations.card.adults')}
                </span>
                {reservation.children > 0 && (
                    <span className="flex items-center gap-1">
                        <FaChild className="text-xs" /> {reservation.children} {t('reservations.card.children')}
                    </span>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                <span className="font-bold text-neutral-900 text-sm">{formatCurrency(reservation.totalPrice)}</span>
                <div className="flex gap-1">
                    {(reservation.status === ReservationStatus.Pending ||
                      reservation.status === ReservationStatus.Confirmed ||
                      reservation.status === ReservationStatus.CheckedIn) && (
                        <button
                            onClick={onEdit}
                            className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title={t('common.edit')}
                        >
                            <FaEdit className="text-xs" />
                        </button>
                    )}
                    <button
                        onClick={onViewDetails}
                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                        title="Ver detalles"
                    >
                        <FaEye className="text-xs" />
                    </button>
                    <button
                        onClick={onViewInvoice}
                        className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title={t('reservations.viewInvoice')}
                    >
                        <FaFileInvoiceDollar className="text-xs" />
                    </button>
                    {reservation.status !== ReservationStatus.Cancelled && reservation.status !== ReservationStatus.CheckedOut && (
                        <button
                            onClick={onCancel}
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Cancelar"
                        >
                            <FaTimesCircle className="text-xs" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReservationCard;