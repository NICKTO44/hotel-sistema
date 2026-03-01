import { useState, useMemo } from 'react';
import { Room, RoomStatus, RoomType } from '../types';
import { FaPlus, FaBed, FaEdit, FaSearch, FaDoorOpen, FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import EditRoomModal from '../components/layout/EditRoomModal';
import CreateRoomModal from '../components/layout/CreateRoomModal';
import { useTranslation } from 'react-i18next';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useRooms, useRoomTypes, useToggleRoomActive } from '../hooks/useRooms';
import { exportRoomsToExcel } from '../utils/excelExports';
import { generateRoomListPDF } from '../utils/pdfExports';
import { useSettings } from '../hooks/useSettings';
import { useCurrency } from '../hooks/useCurrency';

const Rooms = () => {
    const { t } = useTranslation();
    const { data: settings } = useSettings();
    const { formatCurrency } = useCurrency();
    const { data: rooms = [], isLoading: loading } = useRooms();
    const { data: roomTypes = [] } = useRoomTypes();
    const toggleRoomActiveMutation = useToggleRoomActive();

    const [isModalOpen, setIsModalOpen]   = useState(false);
    const [editRoom, setEditRoom]         = useState<Room | null>(null);
    const [toggleRoom, setToggleRoom]     = useState<Room | null>(null);
    const [searchTerm, setSearchTerm]     = useState('');
    const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');
    const [typeFilter, setTypeFilter]     = useState<string>('all');
    const [currentPage, setCurrentPage]   = useState(1);
    const itemsPerPage = 10;

    const filteredRooms = useMemo(() => rooms.filter((room: Room) => {
        const matchesSearch = room.number.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || room.status === statusFilter;
        const matchesType   = typeFilter === 'all' || room.roomTypeId === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    }), [rooms, searchTerm, statusFilter, typeFilter]);

    const totalPages    = Math.ceil(filteredRooms.length / itemsPerPage);
    const paginatedRooms = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredRooms.slice(start, start + itemsPerPage);
    }, [filteredRooms, currentPage]);

    const handleToggleActive = async () => {
        if (!toggleRoom) return;
        try {
            await toggleRoomActiveMutation.mutateAsync(toggleRoom.id);
            setToggleRoom(null);
        } catch (error) {
            console.error('Failed to toggle room status', error);
        }
    };

    const getStatusStyle = (status: RoomStatus) => {
        switch (status) {
            case RoomStatus.Available:   return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            case RoomStatus.Occupied:    return 'bg-black text-white border border-black';
            case RoomStatus.Cleaning:    return 'bg-amber-50 text-amber-700 border border-amber-200';
            case RoomStatus.Maintenance: return 'bg-gray-100 text-gray-600 border border-gray-200';
            default:                     return 'bg-gray-100 text-gray-500 border border-gray-200';
        }
    };

    const getStatusLabel = (status: RoomStatus) => {
        switch (status) {
            case RoomStatus.Available:   return t('rooms.status.available');
            case RoomStatus.Occupied:    return t('rooms.status.occupied');
            case RoomStatus.Cleaning:    return t('rooms.status.cleaning');
            case RoomStatus.Maintenance: return t('rooms.status.maintenance');
            default:                     return 'Unknown';
        }
    };

    // Contadores para stats rápidas
    const stats = useMemo(() => ({
        total:       rooms.length,
        available:   rooms.filter((r: Room) => r.status === RoomStatus.Available).length,
        occupied:    rooms.filter((r: Room) => r.status === RoomStatus.Occupied).length,
        cleaning:    rooms.filter((r: Room) => r.status === RoomStatus.Cleaning).length,
        maintenance: rooms.filter((r: Room) => r.status === RoomStatus.Maintenance).length,
    }), [rooms]);

    return (
        <div className="space-y-6 p-1">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                    <h1 className="text-2xl font-black text-black tracking-tight">{t('rooms.title')}</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{t('rooms.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportRoomsToExcel(filteredRooms)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 transition-all"
                    >
                        <FaFileExcel className="text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => settings && generateRoomListPDF(filteredRooms, settings)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
                    >
                        <FaFilePdf className="text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:-translate-y-0.5"
                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 12px rgba(5,150,105,0.35)' }}
                    >
                        <FaPlus className="text-xs" />
                        <span>{t('rooms.addRoom')}</span>
                    </button>
                </div>
            </div>

            {/* ── Stats rápidas ── */}
            {!loading && rooms.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: t('rooms.status.available'),   value: stats.available,   color: 'border-emerald-200 bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
                        { label: t('rooms.status.occupied'),    value: stats.occupied,    color: 'border-gray-900 bg-gray-900',      text: 'text-white',       dot: 'bg-white' },
                        { label: t('rooms.status.cleaning'),    value: stats.cleaning,    color: 'border-amber-200 bg-amber-50',     text: 'text-amber-700',   dot: 'bg-amber-500' },
                        { label: t('rooms.status.maintenance'), value: stats.maintenance, color: 'border-gray-200 bg-gray-50',       text: 'text-gray-600',    dot: 'bg-gray-400' },
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

            {/* ── Filtros ── */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-600 to-teal-500 rounded-t-2xl" />
                <div className="flex flex-col md:flex-row gap-3 mt-1">
                    {/* Buscador */}
                    <div className="relative flex-1">
                        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 text-sm" />
                        <input
                            type="text"
                            placeholder={t('rooms.searchPlaceholder')}
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all bg-gray-50/50 font-medium placeholder-gray-300"
                        />
                    </div>
                    {/* Estado */}
                    <select
                        value={statusFilter}
                        onChange={e => { setStatusFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value) as RoomStatus); setCurrentPage(1); }}
                        className="px-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 bg-white text-gray-700 font-medium transition-all"
                    >
                        <option value="all">{t('rooms.allStatuses')}</option>
                        <option value={RoomStatus.Available}>{t('rooms.status.available')}</option>
                        <option value={RoomStatus.Occupied}>{t('rooms.status.occupied')}</option>
                        <option value={RoomStatus.Cleaning}>{t('rooms.status.cleaning')}</option>
                        <option value={RoomStatus.Maintenance}>{t('rooms.status.maintenance')}</option>
                    </select>
                    {/* Tipo */}
                    <select
                        value={typeFilter}
                        onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2.5 text-sm border-2 border-gray-100 rounded-xl focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 bg-white text-gray-700 font-medium transition-all"
                    >
                        <option value="all">{t('rooms.allTypes')}</option>
                        {roomTypes.map((type: RoomType) => (
                            <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Contenido ── */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-10 w-10 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3, borderColor: '#059669', borderTopColor: 'transparent' }} />
                    <p className="text-sm text-gray-400 font-medium">Cargando habitaciones...</p>
                </div>
            ) : filteredRooms.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState
                        icon={<FaDoorOpen />}
                        title={t('rooms.noRooms')}
                        description={t('rooms.noRoomsDescription')}
                        action={!searchTerm && typeFilter === 'all' && statusFilter === 'all' ? {
                            label: t('rooms.addRoom'),
                            onClick: () => setIsModalOpen(true)
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
                                        {['Habitación', 'Tipo', 'Piso', 'Estado', 'Precio/Noche', 'Activo', 'Acciones'].map((col, i) => (
                                            <th
                                                key={col}
                                                className={`px-4 py-3.5 text-xs font-black text-gray-400 uppercase tracking-widest ${i === 4 ? 'text-right' : i === 6 ? 'text-center' : 'text-left'}`}
                                            >
                                                {col}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {paginatedRooms.map((room: Room, idx: number) => (
                                        <tr
                                            key={room.id}
                                            className={`hover:bg-emerald-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}
                                        >
                                            {/* Habitación */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                                                        style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                                                    >
                                                        <FaBed className="text-white text-xs" />
                                                    </div>
                                                    <span className="font-bold text-gray-900">
                                                        {t('common.room')} {room.number}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Tipo */}
                                            <td className="px-4 py-3.5">
                                                <span className="text-gray-600 font-medium bg-gray-100 px-2.5 py-1 rounded-lg text-xs">
                                                    {room.roomTypeName || '-'}
                                                </span>
                                            </td>
                                            {/* Piso */}
                                            <td className="px-4 py-3.5">
                                                <span className="text-gray-500 font-semibold">{room.floor}</span>
                                            </td>
                                            {/* Estado */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusStyle(room.status)}`}>
                                                    {getStatusLabel(room.status)}
                                                </span>
                                            </td>
                                            {/* Precio */}
                                            <td className="px-4 py-3.5 text-right font-black text-gray-900">
                                                {formatCurrency(room.pricePerNight)}
                                            </td>
                                            {/* Activo */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    room.isActive
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                                                }`}>
                                                    {room.isActive ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            {/* Acciones */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => setEditRoom(room)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-300 rounded-lg transition-all"
                                                        title={t('common.edit')}
                                                    >
                                                        <FaEdit className="text-xs" />
                                                        <span className="hidden lg:inline">{t('common.edit')}</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setToggleRoom(room)}
                                                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-all ${
                                                            room.isActive
                                                                ? 'text-gray-600 hover:text-red-600 hover:bg-red-50 border-gray-200 hover:border-red-200'
                                                                : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300'
                                                        }`}
                                                        title={room.isActive ? 'Desactivar' : 'Activar'}
                                                    >
                                                        {room.isActive
                                                            ? <FaToggleOn className="text-emerald-600 text-sm" />
                                                            : <FaToggleOff className="text-gray-400 text-sm" />
                                                        }
                                                        <span className="hidden lg:inline">{room.isActive ? 'Desactivar' : 'Activar'}</span>
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
                                <span className="font-semibold text-gray-600">{filteredRooms.length}</span> habitaciones
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
            <CreateRoomModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => {}} />
            <EditRoomModal isOpen={!!editRoom} onClose={() => setEditRoom(null)} room={editRoom} />
            <ConfirmDialog
                isOpen={!!toggleRoom}
                onClose={() => setToggleRoom(null)}
                onConfirm={handleToggleActive}
                title={toggleRoom?.isActive ? t('rooms.inactive') : t('rooms.active')}
                message={toggleRoom ? (toggleRoom.isActive ? t('rooms.confirmDeactivate') : t('rooms.confirmActivate')) : ''}
                confirmText={t('common.confirm')}
                cancelText={t('common.cancel')}
                type={toggleRoom?.isActive ? 'danger' : 'info'}
            />
        </div>
    );
};

export default Rooms;