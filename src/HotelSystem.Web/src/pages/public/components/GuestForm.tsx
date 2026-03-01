import { FaArrowLeft, FaCheck, FaShieldAlt } from 'react-icons/fa';

const COUNTRIES = [
    'Argentina','Australia','Austria','Belgium','Bolivia','Brazil','Canada','Chile',
    'China','Colombia','Costa Rica','Cuba','Denmark','Dominican Republic','Ecuador',
    'Egypt','El Salvador','Finland','France','Germany','Greece','Guatemala','Honduras',
    'India','Indonesia','Ireland','Israel','Italy','Jamaica','Japan','Kenya',
    'Mexico','Morocco','Netherlands','New Zealand','Nicaragua','Nigeria','Norway',
    'Pakistan','Panama','Paraguay','Peru','Philippines','Poland','Portugal',
    'Romania','Russia','Saudi Arabia','South Africa','Spain','Sweden','Switzerland',
    'Turkey','Ukraine','United Kingdom','United States','Uruguay','Venezuela','Vietnam',
];

interface GuestData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    nationality: string;
    identificationNumber: string;
    notes: string;
}

interface GuestFormProps {
    guest: GuestData;
    onChange: (field: keyof GuestData, value: string) => void;
    onSubmit: () => void;
    onBack: () => void;
    submitting: boolean;
    error: string;
}

const inputCls = 'w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent';

const GuestForm = ({ guest, onChange, onSubmit, onBack, submitting, error }: GuestFormProps) => {
    return (
        <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={onBack}
                    className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                >
                    <FaArrowLeft />
                </button>
                <div>
                    <h2 className="text-xl font-bold text-neutral-900">Datos del huésped</h2>
                    <p className="text-sm text-neutral-500">Completa tus datos para confirmar la reserva</p>
                </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">

                {/* Nombre y Apellido */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre *</label>
                        <input
                            type="text"
                            value={guest.firstName}
                            onChange={e => onChange('firstName', e.target.value)}
                            placeholder="Juan"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Apellido *</label>
                        <input
                            type="text"
                            value={guest.lastName}
                            onChange={e => onChange('lastName', e.target.value)}
                            placeholder="Pérez"
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Nacionalidad */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Nacionalidad *</label>
                    <select
                        value={guest.nationality}
                        onChange={e => onChange('nationality', e.target.value)}
                        className={inputCls}
                    >
                        <option value="">Selecciona tu país</option>
                        {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Email */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Correo electrónico *</label>
                    <input
                        type="email"
                        value={guest.email}
                        onChange={e => onChange('email', e.target.value)}
                        placeholder="juan@email.com"
                        className={inputCls}
                    />
                </div>

                {/* Teléfono + DNI */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Teléfono *</label>
                        <input
                            type="tel"
                            value={guest.phone}
                            onChange={e => onChange('phone', e.target.value)}
                            placeholder="+51 999 999 999"
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">DNI / Pasaporte *</label>
                        <input
                            type="text"
                            value={guest.identificationNumber}
                            onChange={e => onChange('identificationNumber', e.target.value)}
                            placeholder="12345678"
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Notas */}
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Notas adicionales <span className="text-neutral-400 font-normal">(opcional)</span>
                    </label>
                    <textarea
                        value={guest.notes}
                        onChange={e => onChange('notes', e.target.value)}
                        placeholder="Llegada tardía, peticiones especiales..."
                        rows={3}
                        className={`${inputCls} resize-none`}
                    />
                </div>

                {/* Error */}
                {error && (
                    <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                    </p>
                )}

                {/* Botón confirmar */}
                <button
                    onClick={onSubmit}
                    disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                    {submitting ? (
                        <>
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Confirmando reserva...
                        </>
                    ) : (
                        <><FaCheck /> Confirmar reserva</>
                    )}
                </button>

                <p className="text-xs text-neutral-400 text-center flex items-center justify-center gap-1">
                    <FaShieldAlt /> Tus datos están protegidos y seguros
                </p>
            </div>
        </div>
    );
};

export default GuestForm;