import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { reservationSchema, ReservationFormData } from '../../utils/validations';
import { Guest, Room, guestService, roomService, reservationService, Reservation } from '../../services/api';
import { FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { showSuccessToast, showErrorToast } from '../../utils/toast';
import { useSettings } from '../../hooks/useSettings';
import { useTranslation } from 'react-i18next';

interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialData?: Reservation | null;
}

const inputBase = 'w-full px-3 py-2 text-sm border rounded-md outline-none transition-all bg-white';
const inputNormal = 'border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const inputValid = 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-500';
const inputInvalid = 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-400';

const ReservationModal = ({ isOpen, onClose, onSuccess, initialData }: ReservationModalProps) => {
    const { t } = useTranslation();
    const [guests, setGuests] = useState<Guest[]>([]);
    const [rooms, setRooms] = useState<Room[]>([]);
    const { data: settings } = useSettings();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, touchedFields },
        reset,
        setValue,
    } = useForm<ReservationFormData>({
        resolver: zodResolver(reservationSchema),
        mode: 'onChange',
        defaultValues: {
            guestId: '',
            roomId: '',
            checkInDate: '',
            checkOutDate: '',
            adults: 1,
            children: 0,
            notes: '',
        }
    });

    useEffect(() => {
        if (isOpen) loadData();
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && initialData) {
            setValue('guestId', initialData.guestId);
            setValue('roomId', initialData.roomId);
            setValue('checkInDate', new Date(initialData.checkInDate).toISOString().split('T')[0]);
            setValue('checkOutDate', new Date(initialData.checkOutDate).toISOString().split('T')[0]);
            setValue('adults', initialData.adults);
            setValue('children', initialData.children);
            setValue('notes', initialData.notes || '');
        } else if (isOpen && !initialData) {
            reset({ guestId: '', roomId: '', checkInDate: '', checkOutDate: '', adults: 1, children: 0, notes: '' });
            if (guests.length > 0) setValue('guestId', guests[0].id);
            if (rooms.length > 0) setValue('roomId', rooms[0].id);
        }
    }, [isOpen, initialData, setValue, reset, guests, rooms]);

    const loadData = async () => {
        try {
            const [guestsData, roomsData] = await Promise.all([
                guestService.getAll(),
                roomService.getAll()
            ]);
            setGuests(guestsData);
            setRooms(roomsData);
            if (!initialData) {
                if (guestsData.length > 0) setValue('guestId', guestsData[0].id);
                if (roomsData.length > 0) setValue('roomId', roomsData[0].id);
            }
        } catch (error) {
            showErrorToast('No se pudieron cargar los datos');
        }
    };

    const onSubmit = async (data: ReservationFormData) => {
        try {
            if (initialData) {
                await reservationService.update(initialData.id, data);
                showSuccessToast('Reservación actualizada correctamente');
            } else {
                await reservationService.create(data);
                const guest = guests.find(g => g.id === data.guestId);
                const room = rooms.find(r => r.id === data.roomId);
                showSuccessToast(`Reservación creada para ${guest?.firstName || 'huésped'} en habitación ${room?.number || ''}`);
            }
            onSuccess();
            reset();
            onClose();
        } catch (error) {
            showErrorToast(initialData ? 'No se pudo actualizar la reservación' : 'No se pudo crear la reservación');
        }
    };

    const fieldClass = (name: keyof ReservationFormData) => {
        if (!touchedFields[name]) return `${inputBase} ${inputNormal}`;
        return `${inputBase} ${errors[name] ? inputInvalid : inputValid}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">
                        {initialData ? 'Editar Reservación' : 'Nueva Reservación'}
                    </h2>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    {/* Huésped & Habitación */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Huésped *</label>
                            <div className="relative">
                                <select {...register('guestId')} className={fieldClass('guestId')}>
                                    <option value="">Seleccione</option>
                                    {guests.map(g => (
                                        <option key={g.id} value={g.id}>{g.firstName} {g.lastName}</option>
                                    ))}
                                </select>
                                {touchedFields.guestId && !errors.guestId && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs pointer-events-none" />}
                                {touchedFields.guestId && errors.guestId && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs pointer-events-none" />}
                            </div>
                            {errors.guestId && <p className="text-xs text-red-600 mt-1">{errors.guestId.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Habitación *</label>
                            <div className="relative">
                                <select {...register('roomId')} className={fieldClass('roomId')}>
                                    <option value="">Seleccione</option>
                                    {rooms.map(r => (
                                        <option key={r.id} value={r.id}>
                                            {r.number} - {r.roomTypeName} ({settings?.currencySymbol || '$'}{r.pricePerNight})
                                        </option>
                                    ))}
                                </select>
                                {touchedFields.roomId && !errors.roomId && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs pointer-events-none" />}
                                {touchedFields.roomId && errors.roomId && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs pointer-events-none" />}
                            </div>
                            {errors.roomId && <p className="text-xs text-red-600 mt-1">{errors.roomId.message}</p>}
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Entrada *</label>
                            <div className="relative">
                                <input type="date" {...register('checkInDate')} className={fieldClass('checkInDate')} />
                                {touchedFields.checkInDate && !errors.checkInDate && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />}
                                {touchedFields.checkInDate && errors.checkInDate && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs" />}
                            </div>
                            {errors.checkInDate && <p className="text-xs text-red-600 mt-1">{errors.checkInDate.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">Fecha de Salida *</label>
                            <div className="relative">
                                <input type="date" {...register('checkOutDate')} className={fieldClass('checkOutDate')} />
                                {touchedFields.checkOutDate && !errors.checkOutDate && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />}
                                {touchedFields.checkOutDate && errors.checkOutDate && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs" />}
                            </div>
                            {errors.checkOutDate && <p className="text-xs text-red-600 mt-1">{errors.checkOutDate.message}</p>}
                        </div>
                    </div>

                    {/* Adultos & Niños */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('reservations.fields.adults')} *</label>
                            <div className="relative">
                                <input type="number" {...register('adults', { valueAsNumber: true })} min="1" className={fieldClass('adults')} />
                                {touchedFields.adults && !errors.adults && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />}
                                {touchedFields.adults && errors.adults && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs" />}
                            </div>
                            {errors.adults && <p className="text-xs text-red-600 mt-1">{errors.adults.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('reservations.fields.children')}</label>
                            <div className="relative">
                                <input type="number" {...register('children', { valueAsNumber: true })} min="0" className={fieldClass('children')} />
                                {touchedFields.children && !errors.children && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs" />}
                                {touchedFields.children && errors.children && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs" />}
                            </div>
                            {errors.children && <p className="text-xs text-red-600 mt-1">{errors.children.message}</p>}
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Notas</label>
                        <textarea
                            {...register('notes')}
                            className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
                            rows={3}
                            placeholder="Indicaciones especiales o preferencias del huésped..."
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                        <button
                            type="button"
                            onClick={() => { reset(); onClose(); }}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Reservación')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReservationModal;