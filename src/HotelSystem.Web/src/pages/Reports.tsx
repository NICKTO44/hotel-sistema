import { useState, useEffect } from 'react';
import { FaChartLine, FaCalendar, FaUsers, FaDollarSign, FaBed } from 'react-icons/fa';
import { reportService, RevenueReport, OccupancyReport, GuestStats } from '../services/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { useCurrency } from '../hooks/useCurrency';
import { useTranslation } from 'react-i18next';

const COLORS = ['#059669', '#1d4ed8', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#15803d', '#b45309'];

const Reports = () => {
    const { t } = useTranslation();
    const { formatCurrency } = useCurrency();
    const [revenueData, setRevenueData] = useState<RevenueReport | null>(null);
    const [occupancyData, setOccupancyData] = useState<OccupancyReport | null>(null);
    const [guestStats, setGuestStats] = useState<GuestStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => { loadReports(); }, []);

    const loadReports = async () => {
        try {
            setLoading(true);
            const [revenue, occupancy, guests] = await Promise.all([
                reportService.getRevenue(dateRange.startDate, dateRange.endDate),
                reportService.getOccupancy(dateRange.startDate, dateRange.endDate),
                reportService.getGuestStats()
            ]);
            setRevenueData(revenue);
            setOccupancyData(occupancy);
            setGuestStats(guests);
        } catch (error: any) {
            toast.error(t('reports.error'));
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const tooltipStyle = {
        contentStyle: {
            backgroundColor: '#171717',
            border: 'none',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '12px'
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                        <FaChartLine className="text-emerald-600 text-lg" />
                        {t('reports.title')}
                    </h1>
                    <p className="text-sm text-neutral-500 mt-0.5">{t('reports.subtitle')}</p>
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2 bg-white border border-neutral-200 rounded-lg px-3 py-2">
                    <FaCalendar className="text-neutral-400 text-xs flex-shrink-0" />
                    <input
                        type="date"
                        className="text-sm border-0 outline-none bg-transparent text-neutral-700"
                        value={dateRange.startDate}
                        onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })}
                    />
                    <span className="text-neutral-300 text-sm">—</span>
                    <input
                        type="date"
                        className="text-sm border-0 outline-none bg-transparent text-neutral-700"
                        value={dateRange.endDate}
                        onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })}
                    />
                    <button
                        onClick={loadReports}
                        className="ml-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                    >
                        {t('reports.dateRange.update')}
                    </button>
                </div>
            </div>

            {/* Métricas clave */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Ingresos */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                {t('reports.metrics.totalRevenue')}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                                {formatCurrency(revenueData?.totalRevenue || 0)}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <FaDollarSign className="text-emerald-600" />
                        </div>
                    </div>
                </div>

                {/* Ocupación */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                {t('reports.metrics.occupancyRate')}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                                {occupancyData?.currentOccupancyRate.toFixed(1)}%
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                {occupancyData?.occupiedRooms} {t('reports.metrics.ofRooms')} {occupancyData?.totalRooms} {t('reports.metrics.rooms')}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FaBed className="text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Huéspedes */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                {t('reports.metrics.totalGuests')}
                            </p>
                            <p className="text-2xl font-bold text-neutral-900 mt-1">
                                {guestStats?.totalGuests || 0}
                            </p>
                            <p className="text-xs text-neutral-400 mt-0.5">
                                {guestStats?.newGuestsThisMonth || 0} {t('reports.metrics.newThisMonth')}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                            <FaUsers className="text-neutral-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Tendencia de ingresos */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('reports.charts.revenueTrend')}</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={revenueData?.revenueByDate.map(d => ({ ...d, date: formatDate(d.date) }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <Tooltip {...tooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                                type="monotone"
                                dataKey="amount"
                                stroke="#059669"
                                strokeWidth={2}
                                dot={false}
                                name={t('reports.charts.revenue')}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Ingresos por tipo de habitación */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('reports.charts.revenueByRoomType')}</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={revenueData?.revenueByRoomType}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="roomTypeName" stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <Tooltip {...tooltipStyle} formatter={(v: any) => formatCurrency(v)} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="revenue" fill="#171717" radius={[3, 3, 0, 0]} name={t('reports.charts.revenue')} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Tendencia de ocupación */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('reports.charts.occupancyTrend')}</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={occupancyData?.occupancyByDate.map(d => ({ ...d, date: formatDate(d.date) }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <YAxis stroke="#a3a3a3" tick={{ fontSize: 11 }} />
                            <Tooltip {...tooltipStyle} formatter={(v: any) => `${v}%`} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                                type="monotone"
                                dataKey="occupancyRate"
                                stroke="#059669"
                                strokeWidth={2}
                                dot={false}
                                name={t('reports.charts.occupancy')}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Huéspedes por país */}
                <div className="bg-white border border-neutral-200 rounded-lg p-5">
                    <h3 className="text-sm font-semibold text-neutral-700 mb-4">{t('reports.charts.guestsByCountry')}</h3>
                    <ResponsiveContainer width="100%" height={260}>
                        <PieChart>
                            <Pie
                                data={guestStats?.guestsByCountry}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={90}
                                dataKey="count"
                                nameKey="country"
                                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            >
                                {guestStats?.guestsByCountry.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip {...tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;