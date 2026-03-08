import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, RoomFormData } from '../../utils/validations';
import { RoomType, roomService, Room, RoomStatus } from '../../services/api';
import { FaTimes, FaCheckCircle, FaTimesCircle, FaUpload, FaSpinner } from 'react-icons/fa';
import { showErrorToast, showSuccessToast } from '../../utils/toast';
import { useUpdateRoom } from '../../hooks/useRooms';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';

const CLOUDINARY_CLOUD_NAME = 'dh5gcc9oo';
const CLOUDINARY_UPLOAD_PRESET = 'hotel_rooms';

interface EditRoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
}

const EditRoomModal = ({ isOpen, onClose, room }: EditRoomModalProps) => {
    const { t } = useTranslation();
    const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const updateRoomMutation = useUpdateRoom();
    const queryClient = useQueryClient();

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
        setValue,
        watch,
    } = useForm<RoomFormData>({
        resolver: zodResolver(roomSchema),
        mode: 'onChange',
    });

    const imageUrl = watch('imageUrl');

    useEffect(() => {
        if (isOpen && room) {
            loadRoomTypes();
            setValue('number', room.number);
            setValue('roomTypeId', room.roomTypeId);
            setValue('floor', room.floor);
            setValue('imageUrl', room.imageUrl || '');
            setImagePreview(room.imageUrl || '');
        }
    }, [isOpen, room, setValue]);

    useEffect(() => {
        setImagePreview(imageUrl || '');
    }, [imageUrl]);

    const loadRoomTypes = async () => {
        try {
            const types = await roomService.getTypes();
            setRoomTypes(types);
        } catch {
            showErrorToast('No se pudieron cargar los tipos de habitación');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            

            const res = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );
            const data = await res.json();
            if (data.secure_url) {
                const optimizedUrl = data.secure_url.replace('/upload/', '/upload/w_800,q_auto,f_webp/');
                setValue('imageUrl', optimizedUrl);
                showSuccessToast('Imagen subida correctamente');
            } else {
                showErrorToast('Error al subir la imagen');
            }
        } catch {
            showErrorToast('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleStatusChange = async (newStatus: RoomStatus) => {
        if (!room) return;
        try {
            await roomService.updateStatus(room.id, newStatus);
            showSuccessToast('Estado actualizado exitosamente');
            queryClient.invalidateQueries({ queryKey: ['rooms'] });
        } catch {
            showErrorToast('No se pudo actualizar el estado');
        }
    };

    const onSubmit = async (data: RoomFormData) => {
        if (!room) return;
        try {
            await updateRoomMutation.mutateAsync({ id: room.id, data: { id: room.id, ...data } });
            reset();
            onClose();
        } catch {
            // Error handled by hook
        }
    };

    const isFieldValid   = (f: keyof RoomFormData) => touchedFields[f] && !errors[f];
    const isFieldInvalid = (f: keyof RoomFormData) => touchedFields[f] && errors[f];

    if (!isOpen || !room) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-800">{t('rooms.editRoom')}</h2>
                    <button onClick={() => { reset(); onClose(); }} className="text-slate-400 hover:text-slate-600">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Room Number */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('rooms.fields.number')} *</label>
                        <div className="relative">
                            <input type="text" {...register('number')}
                                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all ${isFieldInvalid('number') ? 'border-red-300 bg-red-50' : isFieldValid('number') ? 'border-green-300 bg-green-50' : 'border-slate-300'}`}
                                placeholder={t('rooms.placeholders.number')} />
                            {isFieldValid('number') && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                            {isFieldInvalid('number') && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                        </div>
                        {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number.message}</p>}
                    </div>

                    {/* Room Type */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('rooms.fields.type')} *</label>
                        <div className="relative">
                            <select {...register('roomTypeId')}
                                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white ${isFieldInvalid('roomTypeId') ? 'border-red-300 bg-red-50' : isFieldValid('roomTypeId') ? 'border-green-300 bg-green-50' : 'border-slate-300'}`}>
                                <option value="">{t('common.select')}</option>
                                {roomTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name} (Capacidad: {type.capacity})</option>
                                ))}
                            </select>
                            {isFieldValid('roomTypeId') && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />}
                            {isFieldInvalid('roomTypeId') && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 pointer-events-none" />}
                        </div>
                        {errors.roomTypeId && <p className="text-xs text-red-600 mt-1">{errors.roomTypeId.message}</p>}
                    </div>

                    {/* Floor */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('rooms.fields.floor')} *</label>
                        <div className="relative">
                            <input type="number" {...register('floor', { valueAsNumber: true })}
                                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all ${isFieldInvalid('floor') ? 'border-red-300 bg-red-50' : isFieldValid('floor') ? 'border-green-300 bg-green-50' : 'border-slate-300'}`}
                                placeholder="1" min="0" />
                            {isFieldValid('floor') && <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />}
                            {isFieldInvalid('floor') && <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500" />}
                        </div>
                        {errors.floor && <p className="text-xs text-red-600 mt-1">{errors.floor.message}</p>}
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Foto de la habitación <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <input type="hidden" {...register('imageUrl')} />
                        <div
                            onClick={() => !uploading && fileInputRef.current?.click()}
                            className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${uploading ? 'opacity-60 cursor-not-allowed' : 'hover:border-emerald-400 hover:bg-emerald-50'} ${imagePreview ? 'border-emerald-300' : 'border-slate-200'}`}
                        >
                            {imagePreview ? (
                                <div className="relative">
                                    <img src={imagePreview} alt="Preview" className="w-full h-36 object-cover rounded-xl" />
                                    <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                        <span className="text-white text-sm font-semibold">Cambiar foto</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-6 gap-2">
                                    {uploading
                                        ? <FaSpinner className="text-emerald-500 text-2xl animate-spin" />
                                        : <FaUpload className="text-slate-300 text-2xl" />
                                    }
                                    <p className="text-sm text-slate-400">{uploading ? 'Subiendo imagen...' : 'Click para subir foto'}</p>
                                    <p className="text-xs text-slate-300">JPG, PNG, WEBP — se optimiza automáticamente</p>
                                </div>
                            )}
                        </div>
                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </div>

                    {/* Room Status */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{t('rooms.fields.status')} *</label>
                        <select
                            value={room.status}
                            onChange={(e) => handleStatusChange(parseInt(e.target.value) as RoomStatus)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all bg-white"
                        >
                            <option value={RoomStatus.Available}>{t('rooms.status.available')}</option>
                            <option value={RoomStatus.Occupied}>{t('rooms.status.occupied')}</option>
                            <option value={RoomStatus.Cleaning}>{t('rooms.status.cleaning')}</option>
                            <option value={RoomStatus.Maintenance}>{t('rooms.status.maintenance')}</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">💡 Cambia el estado de la habitación manualmente.</p>
                    </div>

                    {/* Buttons */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={() => { reset(); onClose(); }} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={updateRoomMutation.isPending || uploading} className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                            {updateRoomMutation.isPending ? t('common.saving') : t('common.saveChanges') || 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditRoomModal;