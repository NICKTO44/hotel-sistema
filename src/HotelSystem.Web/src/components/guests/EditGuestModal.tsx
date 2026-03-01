import { useState, useEffect } from 'react';
import { Guest, UpdateGuestRequest } from '../../services/api';
import { FaTimes, FaSave } from 'react-icons/fa';
import { useUpdateGuest } from '../../hooks/useGuests';
import { useTranslation } from 'react-i18next';

interface EditGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    guest: Guest | null;
}

const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
    'Belgium', 'Bolivia', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
    'Costa Rica', 'Cuba', 'Czech Republic', 'Denmark', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Finland', 'France', 'Germany', 'Greece',
    'Guatemala', 'Haiti', 'Honduras', 'Hungary', 'India', 'Indonesia', 'Iran',
    'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan',
    'Kenya', 'South Korea', 'Mexico', 'Morocco', 'Netherlands', 'New Zealand',
    'Nicaragua', 'Nigeria', 'Norway', 'Pakistan', 'Panama', 'Paraguay', 'Peru',
    'Philippines', 'Poland', 'Portugal', 'Puerto Rico', 'Romania', 'Russia',
    'Saudi Arabia', 'South Africa', 'Spain', 'Sweden', 'Switzerland', 'Turkey',
    'Ukraine', 'United Kingdom', 'United States', 'Uruguay', 'Venezuela', 'Vietnam',
];

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

const EditGuestModal = ({ isOpen, onClose, onSuccess, guest }: EditGuestModalProps) => {
    const { t } = useTranslation();
    const updateGuestMutation = useUpdateGuest();

    const [formData, setFormData] = useState<UpdateGuestRequest>({
        id: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        identificationNumber: '',
        nationality: '',
    });

    useEffect(() => {
        if (guest) {
            setFormData({
                id: guest.id,
                firstName: guest.firstName,
                lastName: guest.lastName,
                email: guest.email,
                phone: guest.phone,
                identificationNumber: guest.identificationNumber,
                nationality: (guest as any).nationality || '',
            });
        }
    }, [guest]);

    if (!isOpen || !guest) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateGuestMutation.mutateAsync({ id: guest.id, data: formData });
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to update guest', error);
        }
    };

    const set = (field: keyof UpdateGuestRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setFormData(prev => ({ ...prev, [field]: e.target.value }));

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">{t('guests.actions.edit')}</h2>
                    <button
                        onClick={onClose}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">

                    {/* Nombre y Apellido */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('guests.fields.firstName')}</label>
                            <input
                                type="text"
                                required
                                value={formData.firstName}
                                onChange={set('firstName')}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">{t('guests.fields.lastName')}</label>
                            <input
                                type="text"
                                required
                                value={formData.lastName}
                                onChange={set('lastName')}
                                className={inputCls}
                            />
                        </div>
                    </div>

                    {/* Nacionalidad */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nacionalidad *</label>
                        <select
                            required
                            value={formData.nationality}
                            onChange={set('nationality')}
                            className={inputCls}
                        >
                            <option value="">Seleccione un país</option>
                            {COUNTRIES.map(country => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('guests.fields.email')}</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={set('email')}
                            className={inputCls}
                        />
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">{t('guests.fields.phone')}</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={set('phone')}
                            className={inputCls}
                        />
                    </div>

                    {/* Identificación */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('guests.fields.idNumber')} <span className="text-neutral-400 font-normal">(DNI / Pasaporte)</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.identificationNumber}
                            onChange={set('identificationNumber')}
                            className={inputCls}
                        />
                    </div>

                    {/* Botones */}
                    <div className="flex gap-2 pt-2 border-t border-neutral-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={updateGuestMutation.isPending}
                            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {updateGuestMutation.isPending
                                ? t('common.saving')
                                : <><FaSave className="text-xs" />{t('common.saveChanges')}</>
                            }
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditGuestModal;