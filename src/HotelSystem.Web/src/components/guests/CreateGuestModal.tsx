import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { guestSchema, GuestFormData } from '../../utils/validations';
import { FaTimes, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { useCreateGuest } from '../../hooks/useGuests';
import { useTranslation } from 'react-i18next';

interface CreateGuestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

// Lista de países para el selector de nacionalidad
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

const inputBase = 'w-full px-3 py-2 text-sm border rounded-md outline-none transition-all bg-white';
const inputNormal = 'border-neutral-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent';
const inputValid = 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-500';
const inputInvalid = 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-400';

const CreateGuestModal = ({ isOpen, onClose, onSuccess }: CreateGuestModalProps) => {
    const { t } = useTranslation();
    const createGuestMutation = useCreateGuest();

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset
    } = useForm<GuestFormData>({
        resolver: zodResolver(guestSchema),
        mode: 'onChange',
    });

    const onSubmit = async (data: GuestFormData) => {
        try {
            await createGuestMutation.mutateAsync(data);
            onSuccess();
            reset();
            onClose();
        } catch (error) {
            console.error('Failed to create guest', error);
        }
    };

    const fieldClass = (name: keyof GuestFormData) => {
        if (!touchedFields[name]) return `${inputBase} ${inputNormal}`;
        return `${inputBase} ${errors[name] ? inputInvalid : inputValid}`;
    };

    const FieldIcon = ({ name }: { name: keyof GuestFormData }) => {
        if (!touchedFields[name]) return null;
        if (errors[name]) return <FaTimesCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 text-xs pointer-events-none" />;
        return <FaCheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-xs pointer-events-none" />;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
                    <h2 className="text-lg font-semibold text-neutral-900">{t('guests.registerGuest')}</h2>
                    <button
                        onClick={() => { reset(); onClose(); }}
                        className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                    >
                        <FaTimes />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">

                    {/* Nombre y Apellido */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                {t('guests.fields.firstName')} *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register('firstName')}
                                    placeholder="Juan"
                                    className={fieldClass('firstName')}
                                />
                                <FieldIcon name="firstName" />
                            </div>
                            {errors.firstName && <p className="text-xs text-red-600 mt-1">{errors.firstName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1">
                                {t('guests.fields.lastName')} *
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register('lastName')}
                                    placeholder="Pérez"
                                    className={fieldClass('lastName')}
                                />
                                <FieldIcon name="lastName" />
                            </div>
                            {errors.lastName && <p className="text-xs text-red-600 mt-1">{errors.lastName.message}</p>}
                        </div>
                    </div>

                    {/* Nacionalidad */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Nacionalidad *
                        </label>
                        <div className="relative">
                            <select
                                {...register('nationality')}
                                className={fieldClass('nationality')}
                            >
                                <option value="">Seleccione un país</option>
                                {COUNTRIES.map(country => (
                                    <option key={country} value={country}>{country}</option>
                                ))}
                            </select>
                            <FieldIcon name="nationality" />
                        </div>
                        {errors.nationality && <p className="text-xs text-red-600 mt-1">{errors.nationality.message}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('guests.fields.email')} *
                        </label>
                        <div className="relative">
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="juan.perez@example.com"
                                className={fieldClass('email')}
                            />
                            <FieldIcon name="email" />
                        </div>
                        {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                    </div>

                    {/* Teléfono */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('guests.fields.phone')} *
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                {...register('phone')}
                                placeholder="+51 999 999 999"
                                className={fieldClass('phone')}
                            />
                            <FieldIcon name="phone" />
                        </div>
                        {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
                    </div>

                    {/* Número de identificación */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                            {t('guests.fields.idNumber')} * <span className="text-neutral-400 font-normal">(DNI / Pasaporte)</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                {...register('identificationNumber')}
                                placeholder="12345678"
                                className={fieldClass('identificationNumber')}
                            />
                            <FieldIcon name="identificationNumber" />
                        </div>
                        {errors.identificationNumber && <p className="text-xs text-red-600 mt-1">{errors.identificationNumber.message}</p>}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                        <button
                            type="button"
                            onClick={() => { reset(); onClose(); }}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-md hover:bg-neutral-50 transition-colors"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={createGuestMutation.isPending}
                            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {createGuestMutation.isPending ? t('common.saving') : t('guests.registerGuest')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateGuestModal;