import { useState, useEffect, useMemo } from 'react';
import { roomService } from '../services/api';
import { RoomType } from '../types';
import { FaBed, FaEdit, FaPowerOff, FaUsers, FaFileExcel, FaFilePdf, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import RoomTypeModal from '../components/roomtypes/RoomTypeModal';
import { generateRoomTypesPDF } from '../utils/pdfExports';
import { exportRoomTypesToExcel } from '../utils/excelExports';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../hooks/useSettings';
import { useCurrency } from '../hooks/useCurrency';

const RoomTypes = () => {
    const { t } = useTranslation();
    const { data: settings } = useSettings();
    const { formatCurrency } = useCurrency();
    const [types, setTypes] = useState<RoomType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState<RoomType | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const data = await roomService.getTypes();
            setTypes(data);
        } catch (error) {
            console.error('Failed to fetch room types', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (type: RoomType) => {
        if (!confirm(t('common.confirm') + '?')) return;
        try {
            await roomService.toggleTypeStatus(type.id);
            await fetchTypes();
        } catch (error) {
            console.error('Failed to toggle status', error);
        }
    };

    const totalPages = Math.ceil(types.length / itemsPerPage);
    const paginatedTypes = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return types.slice(start, start + itemsPerPage);
    }, [types, currentPage]);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{t('roomTypes.title')}</h1>
                    <p className="text-sm text-neutral-500 mt-0.5">{t('roomTypes.subtitle')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => exportRoomTypesToExcel(types)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                    >
                        <FaFileExcel className="text-emerald-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                    <button
                        onClick={() => settings && generateRoomTypesPDF(types, settings)}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                    >
                        <FaFilePdf className="text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={() => { setEditingType(null); setIsModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                    >
                        <FaPlus />
                        <span>{t('roomTypes.addRoomType')}</span>
                    </button>
                </div>
            </div>

            <RoomTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchTypes}
                initialData={editingType}
            />

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : types.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-lg p-16 text-center">
                    <FaBed className="text-4xl text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-500">{t('roomTypes.noRoomTypes')}</p>
                </div>
            ) : (
                <>
                    <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-neutral-50 border-b border-neutral-200">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Descripción</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">{t('roomTypes.maxCapacity')}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Precio Base</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Color</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100">
                                    {paginatedTypes.map((type) => (
                                        <tr key={type.id} className="hover:bg-neutral-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded flex items-center justify-center" style={{ backgroundColor: type.color + '20' }}>
                                                        <FaBed className="text-sm" style={{ color: type.color }} />
                                                    </div>
                                                    <span className="font-semibold text-neutral-900">{type.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500 max-w-xs truncate">{type.description || '-'}</td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1 text-neutral-600">
                                                    <FaUsers className="text-xs text-neutral-400" />
                                                    {type.capacity}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-neutral-900">
                                                {formatCurrency(type.basePrice)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center">
                                                    <div className="h-6 w-6 rounded border border-neutral-200" style={{ backgroundColor: type.color }} />
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${type.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-neutral-100 text-neutral-500 border border-neutral-200'}`}>
                                                    {type.isActive !== false ? t('common.active') : t('common.inactive')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-1">
                                                    <button
                                                        onClick={() => { setEditingType(type); setIsModalOpen(true); }}
                                                        className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                                                        title={t('common.edit')}
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(type)}
                                                        className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                                                        title={type.isActive !== false ? t('users.deactivate') : t('users.activate')}
                                                    >
                                                        <FaPowerOff />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-lg px-4 py-3">
                            <p className="text-sm text-neutral-500">
                                Página {currentPage} de {totalPages} — {types.length} tipos
                            </p>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaChevronLeft className="text-xs" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                >
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default RoomTypes;
