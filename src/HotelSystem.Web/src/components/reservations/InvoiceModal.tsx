import { Reservation } from '../../services/api';
import { FaPrint, FaTimes } from 'react-icons/fa';
import { useCurrency } from '../../hooks/useCurrency';
import { useTranslation } from 'react-i18next';

interface InvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    reservation: Reservation | null;
}

const InvoiceModal = ({ isOpen, onClose, reservation }: InvoiceModalProps) => {
    const { formatCurrency } = useCurrency();
    const { t } = useTranslation();
    if (!isOpen || !reservation) return null;

    const checkIn = new Date(reservation.checkInDate);
    const checkOut = new Date(reservation.checkOutDate);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    const pricePerNight = reservation.totalPrice / nights;
    const subtotal = reservation.totalPrice / 1.1;
    const tax = reservation.totalPrice - subtotal;
    const total = reservation.totalPrice;

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white print:absolute print:inset-0">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden print:shadow-none print:w-full print:max-w-none">

                {/* Header - oculto al imprimir */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-neutral-200 print:hidden">
                    <h2 className="text-lg font-semibold text-neutral-900">{t('reservations.invoice.preview')}</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-md transition-colors"
                        >
                            <FaPrint className="text-xs" />
                            {t('reservations.invoice.printInvoice')}
                        </button>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 transition-colors p-1 rounded hover:bg-neutral-100"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                {/* Invoice Content */}
                <div className="p-8 print:p-8 space-y-6" id="invoice-content">

                    {/* Encabezado */}
                    <div className="flex justify-between items-start pb-6 border-b-2 border-neutral-900">
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">
                                {t('reservations.invoice.title')}
                            </h1>
                            <p className="text-neutral-500 text-sm mt-1">
                                #{reservation.id.slice(0, 8).toUpperCase()}
                            </p>
                        </div>
                        <div className="text-right">
                            <h2 className="text-xl font-bold text-neutral-900">Hotel OS</h2>
                            <p className="text-neutral-500 text-sm">123 Luxury Ave, Miami FL</p>
                            <p className="text-neutral-500 text-sm">contact@hotelos.com</p>
                        </div>
                    </div>

                    {/* Bill To & Detalles */}
                    <div className="flex justify-between">
                        <div>
                            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                                {t('reservations.invoice.billTo')}
                            </p>
                            <p className="text-lg font-bold text-neutral-900">{reservation.guestName}</p>
                            <p className="text-sm text-neutral-500">
                                {t('reservations.invoice.guestId')}: {reservation.guestId.slice(0, 8)}
                            </p>
                        </div>
                        <div className="text-right space-y-2">
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    {t('reservations.invoice.dateIssued')}
                                </p>
                                <p className="text-sm font-medium text-neutral-800">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                                    {t('reservations.invoice.stayDuration')}
                                </p>
                                <p className="text-sm font-medium text-neutral-800">
                                    {checkIn.toLocaleDateString()} — {checkOut.toLocaleDateString()}
                                    <span className="text-neutral-400 ml-1">({nights} {t('reservations.invoice.nights')})</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabla */}
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-neutral-50 border-y border-neutral-200">
                                <th className="py-3 px-4 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {t('reservations.invoice.description')}
                                </th>
                                <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {t('reservations.invoice.unitPrice')}
                                </th>
                                <th className="py-3 px-4 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {t('reservations.invoice.qty')}
                                </th>
                                <th className="py-3 px-4 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                    {t('reservations.invoice.amount')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-neutral-100">
                                <td className="py-4 px-4">
                                    <p className="font-semibold text-neutral-900">
                                        {t('reservations.invoice.accommodation', { room: reservation.roomNumber })}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {t('reservations.invoice.standardRate', { nights })}
                                    </p>
                                </td>
                                <td className="py-4 px-4 text-right text-neutral-700">{formatCurrency(pricePerNight)}</td>
                                <td className="py-4 px-4 text-center text-neutral-700">{nights}</td>
                                <td className="py-4 px-4 text-right font-semibold text-neutral-900">
                                    {formatCurrency(reservation.totalPrice)}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Totales */}
                    <div className="flex justify-end">
                        <div className="w-56 space-y-2">
                            <div className="flex justify-between text-sm text-neutral-600">
                                <span>{t('reservations.invoice.subtotal')}</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-neutral-600">
                                <span>{t('reservations.invoice.tax')} (10%)</span>
                                <span>{formatCurrency(tax)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-neutral-900 border-t border-neutral-200 pt-2">
                                <span>{t('reservations.invoice.total')}</span>
                                <span className="text-lg">{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-neutral-400 text-xs border-t border-neutral-100 pt-6">
                        <p>{t('reservations.invoice.thankYou')}</p>
                        <p className="mt-1">{t('reservations.invoice.questions')}</p>
                    </div>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #invoice-content, #invoice-content * { visibility: visible; }
                    #invoice-content { position: absolute; left: 0; top: 0; width: 100%; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceModal;