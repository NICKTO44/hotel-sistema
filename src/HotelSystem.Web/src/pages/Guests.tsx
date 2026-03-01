import { useState, useMemo } from 'react';
import { Guest } from '../services/api';
import { FaPlus, FaEnvelope, FaPhone, FaIdCard, FaEdit, FaHistory, FaSearch, FaUserFriends, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import CreateGuestModal from '../components/guests/CreateGuestModal';
import EditGuestModal from '../components/guests/EditGuestModal';
import GuestHistoryModal from '../components/guests/GuestHistoryModal';
import { useTranslation } from 'react-i18next';
import SkeletonTable from '../components/common/SkeletonTable';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useGuests, useToggleGuestActive } from '../hooks/useGuests';
import { exportGuestsToExcel } from '../utils/excelExports';
import { generateGuestListPDF } from '../utils/pdfExports';
import { useSettings } from '../hooks/useSettings';

const Guests = () => {
    const { t } = useTranslation();
    const { data: settings } = useSettings();
    const { data: guests = [], isLoading: loading, error } = useGuests();
    const toggleGuestActiveMutation = useToggleGuestActive();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editGuest, setEditGuest]       = useState<Guest | null>(null);
    const [historyGuest, setHistoryGuest] = useState<Guest | null>(null);
    const [guestToToggle, setGuestToToggle] = useState<Guest | null>(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 10;

    const filteredGuests = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return guests.filter((guest: Guest) =>
            guest.firstName.toLowerCase().includes(term) ||
            guest.lastName.toLowerCase().includes(term) ||
            guest.email.toLowerCase().includes(term) ||
            guest.identificationNumber.toLowerCase().includes(term)
        );
    }, [guests, searchTerm]);

    const totalPages     = Math.ceil(filteredGuests.length / itemsPerPage);
    const paginatedGuests = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredGuests.slice(start, start + itemsPerPage);
    }, [filteredGuests, currentPage]);

    useMemo(() => { setCurrentPage(1); }, [searchTerm]);

    const handleToggle = () => {
        if (!guestToToggle) return;
        toggleGuestActiveMutation.mutate(guestToToggle.id);
        setGuestToToggle(null);
    };

    const getInitials = (firstName: string, lastName: string) =>
        `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    // Stats rápidas
    const stats = useMemo(() => ({
        total:    guests.length,
        active:   guests.filter((g: Guest) => g.isActive).length,
        inactive: guests.filter((g: Guest) => !g.isActive).length,
    }), [guests]);

    return (
        <div className="space-y-6 p-1">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight">{t('guests.title')}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{t('guests.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportGuestsToExcel(filteredGuests)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                    >
                        <FaFileExcel className="text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => settings && generateGuestListPDF(filteredGuests, settings)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        <FaFilePdf className="text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.35)' }}
                    >
                        <FaPlus className="text-xs" />
                        <span>{t('guests.registerGuest')}</span>
                    </button>
                </div>
            </div>

            {/* ── Stats rápidas ── */}
            {!loading && guests.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total huéspedes', value: stats.total,    color: 'border-gray-200 bg-white',         text: 'text-gray-900', dot: 'bg-gray-400' },
                        { label: 'Activos',          value: stats.active,   color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                        { label: 'Inactivos',        value: stats.inactive, color: 'border-gray-200 bg-gray-50',       text: 'text-gray-500', dot: 'bg-gray-300' },
                    ].map(({ label, value, color, text, dot }) => (
                        <div key={label} className={`border-2 ${color} rounded-2xl px-4 py-3 flex items-center justify-between`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${dot}`} />
                                <span className={`text-xs font-bold ${text}`}>{label}</span>
                            </div>
                            <span className={`text-xl font-black ${text}`}>{value}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Buscador ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 rounded-t-2xl" />
                <div className="relative mt-1">
                    <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                    <input
                        type="text"
                        placeholder={t('guests.searchPlaceholder')}
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 font-medium placeholder-gray-300"
                    />
                </div>
            </div>

            {/* ── Contenido ── */}
            {loading ? (
                <SkeletonTable rows={8} />
            ) : error ? (
                <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-center">
                    <p className="font-bold text-red-700 text-sm">Error al cargar huéspedes</p>
                    <p className="text-xs text-red-400 mt-1">{(error as any)?.message}</p>
                </div>
            ) : filteredGuests.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState
                        icon={<FaUserFriends />}
                        title={searchTerm ? t('guests.noGuests') : t('guests.noGuestsStart')}
                        description={searchTerm ? t('guests.noGuestsFiltered') : t('guests.noGuestsDescription')}
                        action={!searchTerm ? {
                            label: t('guests.registerGuest'),
                            onClick: () => setIsCreateModalOpen(true)
                        } : undefined}
                    />
                </div>
            ) : (
                <>
                    {/* Tabla */}
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111827 100%)' }}>
                                        {['Huésped', 'Contacto', 'Identificación', 'Estado', 'Acciones'].map((col, i) => (
                                            <th
                                                key={col}
                                                className={`px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest ${i === 3 || i === 4 ? 'text-center' : 'text-left'}`}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedGuests.map((guest: Guest, idx: number) => (
                                        <tr
                                            key={guest.id}
                                            className={`hover:bg-emerald-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                        >
                                            {/* Huésped */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-md"
                                                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                                                    >
                                                        {getInitials(guest.firstName, guest.lastName)}
                                                    </div>
                                                    <span className="font-bold text-gray-900">
                                                        {guest.firstName} {guest.lastName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Contacto */}
                                            <td className="px-4 py-3.5">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-gray-500">
                                                        <FaEnvelope className="text-xs text-emerald-500 flex-shrink-0" />
                                                        <span className="text-xs truncate max-w-[160px]">{guest.email}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-500">
                                                        <FaPhone className="text-xs text-gray-300 flex-shrink-0" />
                                                        <span className="text-xs">{guest.phone}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Identificación */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-1.5">
                                                    <FaIdCard className="text-xs text-gray-300" />
                                                    <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                                                        {guest.identificationNumber}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estado */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    guest.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                                }`}>
                                                    {guest.isActive ? t('common.active') : t('common.inactive')}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setEditGuest(guest)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all"
                                                        title={t('common.edit')}
                                                    >
                                                        <FaEdit className="text-xs" />
                                                        <span className="hidden lg:inline">{t('common.edit')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setHistoryGuest(guest)}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-black hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg transition-all"
                                                        title={t('guests.actions.viewHistory')}
                                                    >
                                                        <FaHistory className="text-xs" />
                                                        <span className="hidden lg:inline">Historial</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setGuestToToggle(guest)}
                                                        className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                                                            guest.isActive
                                                                ? 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-200'
                                                                : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300'
                                                        }`}
                                                        title={t('rooms.toggleActive')}
                                                    >
                                                        {guest.isActive
                                                            ? <FaToggleOn className="text-emerald-600 text-sm" />
                                                            : <FaToggleOff className="text-gray-400 text-sm" />
                                                        }
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-3.5 shadow-sm">
                            <p className="text-sm text-gray-400 font-medium">
                                Página <span className="font-black text-gray-700">{currentPage}</span> de <span className="font-black text-gray-700">{totalPages}</span>
                                <span className="mx-2 text-gray-200">·</span>
                                <span className="font-semibold text-gray-600">{filteredGuests.length}</span> huéspedes
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <FaChevronLeft className="text-xs" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold border-2 border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Modals ── */}
            <CreateGuestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {}}
            />
            <EditGuestModal
                isOpen={!!editGuest}
                onClose={() => setEditGuest(null)}
                onSuccess={() => {}}
                guest={editGuest}
            />
            <GuestHistoryModal
                isOpen={!!historyGuest}
                onClose={() => setHistoryGuest(null)}
                guest={historyGuest}
            />
            <ConfirmDialog
                isOpen={!!guestToToggle}
                onClose={() => setGuestToToggle(null)}
                onConfirm={handleToggle}
                title={t('guests.actions.toggleActive')}
                message={guestToToggle?.isActive ? t('guests.confirmDeactivate') : t('guests.confirmActivate')}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
                type={guestToToggle?.isActive ? 'warning' : 'info'}
            />
        </div>
    );
};

export default Guests;