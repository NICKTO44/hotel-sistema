import { useEffect, useState } from 'react';
import { reservationService, Reservation, ReservationStatus } from '../services/api';
import { FaPlus, FaCalendarAlt, FaSearch, FaFileInvoiceDollar, FaCalendarTimes, FaFileExcel, FaFilePdf, FaTh, FaList, FaEye, FaEdit } from 'react-icons/fa';
import ReservationModal from '../components/reservations/ReservationModal';
import InvoiceModal from '../components/reservations/InvoiceModal';
import ReservationDetailsModal from '../components/reservations/ReservationDetailsModal';
import ReservationCard from '../components/reservations/ReservationCard';
import { useTranslation } from 'react-i18next';
import { generateReservationReportPDF } from '../utils/pdfExports';
import { exportReservationsToExcel } from '../utils/excelExports';
import { useSettings } from '../hooks/useSettings';
import SkeletonTable from '../components/common/SkeletonTable';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { showSuccessToast, showErrorToast } from '../utils/toast';
import { useCurrency } from '../hooks/useCurrency';

// ── Helper: detectar si una estancia activa está vencida ─────────────────────
const isOverdue = (reservation: Reservation) => {
    if (reservation.status !== ReservationStatus.CheckedIn) return false;
    const deadline = new Date(reservation.checkOutDate);
    deadline.setHours(11, 0, 0, 0);
    return new Date() > deadline;
};

const canEdit = (status: ReservationStatus) =>
    status === ReservationStatus.Pending ||
    status === ReservationStatus.Confirmed ||
    status === ReservationStatus.CheckedIn;

const Reservations = () => {
    const { t } = useTranslation();
    const { data: settings } = useSettings();
    const { formatCurrency } = useCurrency();
    const [reservations, setReservations]         = useState<Reservation[]>([]);
    const [loading, setLoading]                   = useState(true);
    const [isModalOpen, setIsModalOpen]           = useState(false);
    const [editingReservation, setEditingReservation]         = useState<Reservation | null>(null);
    const [invoiceReservation, setInvoiceReservation]         = useState<Reservation | null>(null);
    const [viewDetailsReservation, setViewDetailsReservation] = useState<Reservation | null>(null);
    const [cancelReservation, setCancelReservation]           = useState<Reservation | null>(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
    const [viewMode, setViewMode]         = useState<'cards' | 'table'>('table');

    useEffect(() => { fetchReservations(); }, []);

    const fetchReservations = async () => {
        setLoading(true);
        try {
            const data = await reservationService.getAll();
            setReservations(data);
        } catch (error) {
            console.error('Failed to fetch reservations', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReservations = reservations.filter(r => {
        const matchesSearch =
            r.guestName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.roomNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCancelReservation = async () => {
        if (!cancelReservation) return;
        try {
            await reservationService.cancel(cancelReservation.id);
            showSuccessToast(t('reservations.cancelledReservation', { room: cancelReservation.roomNumber }));
            fetchReservations();
        } catch {
            showErrorToast(t('reservations.cancelError'));
        }
    };

    const getStatusStyle = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.Pending:    return 'bg-amber-50 text-amber-700 border border-amber-200';
            case ReservationStatus.Confirmed:  return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case ReservationStatus.CheckedIn:  return 'bg-black text-white border border-black';
            case ReservationStatus.CheckedOut: return 'bg-gray-100 text-gray-600 border border-gray-200';
            case ReservationStatus.Cancelled:  return 'bg-red-50 text-red-600 border border-red-200';
            default:                           return 'bg-gray-100 text-gray-500 border border-gray-200';
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
        return labels[status] ?? 'Unknown';
    };

    const statusTabs = [
        { status: 'all' as const,               label: t('reservations.status.all'),        count: reservations.length },
        { status: ReservationStatus.Pending,     label: t('reservations.status.pending'),    count: reservations.filter(r => r.status === ReservationStatus.Pending).length },
        { status: ReservationStatus.Confirmed,   label: t('reservations.status.confirmed'),  count: reservations.filter(r => r.status === ReservationStatus.Confirmed).length },
        { status: ReservationStatus.CheckedIn,   label: t('reservations.status.checkedIn'),  count: reservations.filter(r => r.status === ReservationStatus.CheckedIn).length },
        { status: ReservationStatus.CheckedOut,  label: t('reservations.status.checkedOut'), count: reservations.filter(r => r.status === ReservationStatus.CheckedOut).length },
        { status: ReservationStatus.Cancelled,   label: t('reservations.status.cancelled'),  count: reservations.filter(r => r.status === ReservationStatus.Cancelled).length },
    ];

    const canCancel = (status: ReservationStatus) =>
        status !== ReservationStatus.Cancelled && status !== ReservationStatus.CheckedOut;

    const openEdit = (reservation: Reservation) => {
        setEditingReservation(reservation);
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6 p-1">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight">{t('reservations.title')}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{t('reservations.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportReservationsToExcel(filteredReservations)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                    >
                        <FaFileExcel className="text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => settings && generateReservationReportPDF(filteredReservations, settings)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        <FaFilePdf className="text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => { setEditingReservation(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.35)' }}
                    >
                        <FaPlus className="text-xs" />
                        <span>{t('reservations.newReservation')}</span>
                    </button>
                </div>
            </div>

            {/* ── Filtros ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 rounded-t-2xl" />
                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                        <input
                            type="text"
                            placeholder={t('reservations.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 font-medium placeholder-gray-300"
                        />
                    </div>
                    <div className="flex border-2 border-gray-200 rounded-xl overflow-hidden">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`px-4 py-2.5 text-sm font-bold transition-all ${viewMode === 'table' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                        >
                            <FaList />
                        </button>
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`px-4 py-2.5 text-sm font-bold transition-all ${viewMode === 'cards' ? 'bg-gray-900 text-white' : 'bg-white text-gray-400 hover:bg-gray-50'}`}
                        >
                            <FaTh />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {statusTabs.map(({ status, label, count }) => (
                        <button
                            key={String(status)}
                            onClick={() => setStatusFilter(status)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                statusFilter === status
                                    ? 'bg-gray-900 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                        >
                            {label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-black ${
                                statusFilter === status ? 'bg-white/20 text-white' : 'bg-white text-gray-600'
                            }`}>
                                {count}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Contenido ── */}
            {loading ? (
                <SkeletonTable rows={8} />
            ) : filteredReservations.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState
                        icon={<FaCalendarTimes />}
                        title={t('reservations.noReservations')}
                        description={t('reservations.noReservations')}
                        action={!searchTerm && statusFilter === 'all' ? {
                            label: t('reservations.newReservation'),
                            onClick: () => setIsModalOpen(true)
                        } : undefined}
                    />
                </div>
            ) : viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredReservations.map(reservation => (
                        <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onViewInvoice={() => setInvoiceReservation(reservation)}
                            onCancel={() => setCancelReservation(reservation)}
                            onEdit={() => openEdit(reservation)}
                            onViewDetails={() => setViewDetailsReservation(reservation)}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)' }}>
                                    {[
                                        t('reservations.guest'),
                                        t('reservations.room'),
                                        t('reservations.checkIn'),
                                        t('reservations.checkOut'),
                                        t('reservations.fields.status'),
                                        t('reservations.fields.total'),
                                        t('common.actions'),
                                    ].map((col, i) => (
                                        <th
                                            key={col}
                                            className={`px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest ${i === 5 ? 'text-right' : i === 6 ? 'text-center' : 'text-left'}`}
                                        >
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredReservations.map((reservation, idx) => {
                                    const overdue = isOverdue(reservation);
                                    return (
                                        <tr
                                            key={reservation.id}
                                            className={`transition-colors ${
                                                overdue
                                                    ? 'bg-red-50 border-l-4 border-l-red-400 hover:bg-red-100/50'
                                                    : idx % 2 === 0
                                                        ? 'bg-white hover:bg-emerald-50/40'
                                                        : 'bg-gray-50/30 hover:bg-emerald-50/40'
                                            }`}
                                        >
                                            {/* Huésped */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full text-white text-xs font-black flex items-center justify-center flex-shrink-0 ${overdue ? 'bg-red-500' : 'bg-emerald-600'}`}>
                                                        {reservation.guestName.charAt(0).toUpperCase()}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{reservation.guestName}</span>
                                                </div>
                                            </td>
                                            {/* Habitación */}
                                            <td className="px-4 py-3.5">
                                                <span className="font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                                                    {t('common.room')} {reservation.roomNumber}
                                                </span>
                                            </td>
                                            {/* Check-in */}
                                            <td className="px-4 py-3.5 text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <FaCalendarAlt className="text-emerald-500 text-xs" />
                                                    {new Date(reservation.checkInDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            {/* Check-out */}
                                            <td className="px-4 py-3.5 text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <FaCalendarAlt className={`text-xs ${overdue ? 'text-red-400' : 'text-gray-300'}`} />
                                                    <span className={overdue ? 'text-red-600 font-bold' : ''}>
                                                        {new Date(reservation.checkOutDate).toLocaleDateString()}
                                                    </span>
                                                    {overdue && <span className="text-xs text-red-500 font-bold">· Vencido</span>}
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(reservation.status)}`}>
                                                    {getStatusLabel(reservation.status)}
                                                </span>
                                            </td>
                                            {/* Total */}
                                            <td className="px-4 py-3.5 text-right font-black text-gray-900">
                                                {formatCurrency(reservation.totalPrice)}
                                            </td>
                                            {/* Acciones */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex justify-center items-center gap-1.5">
                                                    <button
                                                        onClick={() => setViewDetailsReservation(reservation)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                                                        title={t('common.details')}
                                                    >
                                                        <FaEye className="text-xs" />
                                                        <span className="hidden lg:inline">{t('common.details')}</span>
                                                    </button>

                                                    {canEdit(reservation.status) && (
                                                        <button
                                                            onClick={() => openEdit(reservation)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all"
                                                            title="Editar"
                                                        >
                                                            <FaEdit className="text-xs" />
                                                            <span className="hidden lg:inline">Editar</span>
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => setInvoiceReservation(reservation)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all"
                                                        title={t('reservations.actions.viewInvoice')}
                                                    >
                                                        <FaFileInvoiceDollar className="text-xs" />
                                                        <span className="hidden lg:inline">Factura</span>
                                                    </button>

                                                    {canCancel(reservation.status) && (
                                                        <button
                                                            onClick={() => setCancelReservation(reservation)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-red-700 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-lg transition-all"
                                                            title={t('reservations.actions.cancel')}
                                                        >
                                                            <FaCalendarTimes className="text-xs" />
                                                            <span className="hidden lg:inline">{t('common.cancel')}</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Modals ── */}
            <ReservationModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setEditingReservation(null); }}
                onSuccess={fetchReservations}
                initialData={editingReservation}
            />
            <InvoiceModal
                isOpen={!!invoiceReservation}
                onClose={() => setInvoiceReservation(null)}
                reservation={invoiceReservation}
            />
            <ReservationDetailsModal
                isOpen={!!viewDetailsReservation}
                onClose={() => setViewDetailsReservation(null)}
                reservation={viewDetailsReservation}
            />
            <ConfirmDialog
                isOpen={!!cancelReservation}
                onClose={() => setCancelReservation(null)}
                onConfirm={handleCancelReservation}
                title={t('reservations.confirmCancelDialog.title')}
                message={cancelReservation
                    ? t('reservations.confirmCancelDialog.message', {
                        guest: cancelReservation.guestName,
                        room:  cancelReservation.roomNumber,
                    })
                    : ''}
                confirmText={t('reservations.confirmCancelDialog.confirmButton')}
                cancelText={t('reservations.confirmCancelDialog.cancelButton')}
                type="warning"
            />
        </div>
    );
};

export default Reservations;