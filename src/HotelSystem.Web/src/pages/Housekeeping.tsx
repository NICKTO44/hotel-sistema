import { useMemo } from 'react';
import { Room, RoomStatus } from '../services/api';
import { FaBroom, FaCheck, FaSprayCan, FaFilePdf, FaBed, FaTools, FaCheckCircle } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useRooms, useUpdateRoomStatus } from '../hooks/useRooms';
import { generateHousekeepingReportPDF } from '../utils/pdfExports';

const StatusBadge = ({ status }: { status: RoomStatus }) => {
    const { t } = useTranslation();
    switch (status) {
        case RoomStatus.Cleaning:
            return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded"><FaBroom className="text-xs" />{t('rooms.status.cleaning')}</span>;
        case RoomStatus.Occupied:
            return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded"><FaBed className="text-xs" />{t('rooms.status.occupied')}</span>;
        case RoomStatus.Maintenance:
            return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 rounded"><FaTools className="text-xs" />{t('rooms.status.maintenance')}</span>;
        default:
            return null;
    }
};

const RoomCard = ({ room, onMarkAsClean, onMarkAsCleaning }: { room: Room; onMarkAsClean: () => void; onMarkAsCleaning: () => void }) => {
    const { t } = useTranslation();
    return (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:border-neutral-300 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-neutral-900 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{room.number}</span>
                    </div>
                    <div>
                        <p className="font-semibold text-neutral-900 text-sm">{t('common.room')} {room.number}</p>
                        <p className="text-xs text-neutral-500">{room.roomTypeName} · {t('common.floor')} {room.floor}</p>
                    </div>
                </div>
                <StatusBadge status={room.status} />
            </div>
            <div className="space-y-2">
                {(room.status === RoomStatus.Cleaning || room.status === RoomStatus.Maintenance) && (
                    <button
                        onClick={onMarkAsClean}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                    >
                        <FaCheck className="text-xs" />
                        {t('housekeeping.markAsClean')}
                    </button>
                )}
                {room.status === RoomStatus.Occupied && (
                    <button
                        onClick={onMarkAsCleaning}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-md transition-colors"
                    >
                        <FaSprayCan className="text-xs" />
                        {t('housekeeping.requestCleaning')}
                    </button>
                )}
            </div>
        </div>
    );
};

const Housekeeping = () => {
    const { t } = useTranslation();
    const { data: allRooms = [], isLoading: loading } = useRooms();
    const updateStatusMutation = useUpdateRoomStatus();

    const { cleaningRooms, occupiedRooms, maintenanceRooms, stats } = useMemo(() => {
        const cleaning = allRooms.filter((r: Room) => r.status === RoomStatus.Cleaning);
        const occupied = allRooms.filter((r: Room) => r.status === RoomStatus.Occupied);
        const maintenance = allRooms.filter((r: Room) => r.status === RoomStatus.Maintenance);
        const available = allRooms.filter((r: Room) => r.status === RoomStatus.Available);
        return {
            cleaningRooms: cleaning.sort((a: Room, b: Room) => a.number.localeCompare(b.number)),
            occupiedRooms: occupied.sort((a: Room, b: Room) => a.number.localeCompare(b.number)),
            maintenanceRooms: maintenance.sort((a: Room, b: Room) => a.number.localeCompare(b.number)),
            stats: { cleaning: cleaning.length, occupied: occupied.length, maintenance: maintenance.length, clean: available.length }
        };
    }, [allRooms]);

    const markAsClean = (room: Room) => updateStatusMutation.mutate({ id: room.id, status: RoomStatus.Available, successMessage: `Habitación ${room.number} marcada como limpia` });
    const markAsCleaning = (room: Room) => updateStatusMutation.mutate({ id: room.id, status: RoomStatus.Cleaning, successMessage: `Habitación ${room.number} en limpieza` });

    const statCards = [
        { label: t('housekeeping.cleaningNeeded', 'En Limpieza'), value: stats.cleaning, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
        { label: t('housekeeping.occupiedRooms', 'Ocupadas'), value: stats.occupied, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
        { label: t('housekeeping.inMaintenance', 'Mantenimiento'), value: stats.maintenance, color: 'text-neutral-600', bg: 'bg-neutral-50 border-neutral-200' },
        { label: t('housekeeping.cleanRooms', 'Limpias'), value: stats.clean, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    ];

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{t('housekeeping.title')}</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">{t('housekeeping.subtitle')}</p>
                </div>
                <button
                    onClick={() => generateHousekeepingReportPDF([...cleaningRooms, ...occupiedRooms, ...maintenanceRooms])}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                >
                    <FaFilePdf className="text-red-400" />
                    {t('housekeeping.printReport')}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((s) => (
                    <div key={s.label} className={`bg-white border rounded-lg p-4 ${s.bg}`}>
                        <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-sm text-neutral-600 mt-1">{s.label}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : stats.cleaning + stats.maintenance === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center">
                    <FaCheckCircle className="text-5xl text-emerald-500 mx-auto mb-3" />
                    <h3 className="text-xl font-bold text-neutral-800 mb-1">{t('housekeeping.allClean', '¡Todo Limpio!')}</h3>
                    <p className="text-neutral-500 text-sm">{t('housekeeping.noTasks', 'No hay tareas pendientes')}</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {cleaningRooms.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-amber-500 inline-block" />
                                {t('housekeeping.cleaningNeeded', 'Requieren Limpieza')} ({cleaningRooms.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {cleaningRooms.map((room) => (
                                    <RoomCard key={room.id} room={room} onMarkAsClean={() => markAsClean(room)} onMarkAsCleaning={() => markAsCleaning(room)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {occupiedRooms.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-red-500 inline-block" />
                                {t('housekeeping.occupiedRooms', 'Ocupadas')} ({occupiedRooms.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {occupiedRooms.map((room) => (
                                    <RoomCard key={room.id} room={room} onMarkAsClean={() => markAsClean(room)} onMarkAsCleaning={() => markAsCleaning(room)} />
                                ))}
                            </div>
                        </div>
                    )}

                    {maintenanceRooms.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-neutral-500 inline-block" />
                                {t('housekeeping.inMaintenance', 'Mantenimiento')} ({maintenanceRooms.length})
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                {maintenanceRooms.map((room) => (
                                    <RoomCard key={room.id} room={room} onMarkAsClean={() => markAsClean(room)} onMarkAsCleaning={() => markAsCleaning(room)} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Housekeeping;
