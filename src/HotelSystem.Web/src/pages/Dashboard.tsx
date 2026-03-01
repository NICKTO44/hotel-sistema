import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBed, FaCalendarCheck, FaChartLine, FaMoneyBillWave, FaArrowRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import StatsCard from '../components/dashboard/StatsCard';
import RevenueChart from '../components/dashboard/RevenueChart';
import DataOverview from '../components/dashboard/DataOverview';
import SalesAnalytics from '../components/dashboard/SalesAnalytics';
import PerformanceDevice from '../components/dashboard/PerformanceDevice';
import { useQuery } from '@tanstack/react-query';
import { dashboardService, DashboardStats, ReservationStatus } from '../services/api';
import { useNotifications } from '../context/NotificationContext';
import { format, subDays } from 'date-fns';
import { useCurrency } from '../hooks/useCurrency';

const Dashboard = () => {
    const { t } = useTranslation();
    const { notifications } = useNotifications();
    const { formatCurrency } = useCurrency();
    const [stats, setStats] = useState<DashboardStats | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: dashboardService.getStats
    });

    const endDate = format(new Date(), 'yyyy-MM-dd');
    const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');

    const { data: revenueData = [] } = useQuery({
        queryKey: ['dashboard-revenue', startDate, endDate],
        queryFn: () => dashboardService.getRevenueChart(startDate, endDate)
    });

    useEffect(() => {
        if (data) setStats(data);
    }, [data]);

    useEffect(() => {
        if (notifications.length > 0) refetch();
    }, [notifications, refetch]);

    const getOccupancyRate = () => {
        if (!stats || stats.totalRooms === 0) return 0;
        return Math.round((stats.occupiedRooms / stats.totalRooms) * 100);
    };

    const getStatusColor = (status: ReservationStatus) => {
        switch (status) {
            case ReservationStatus.Confirmed:  return 'text-green-700 bg-green-50 border border-green-200';
            case ReservationStatus.CheckedIn:  return 'text-white bg-green-700';
            case ReservationStatus.CheckedOut: return 'text-gray-600 bg-gray-100 border border-gray-200';
            case ReservationStatus.Cancelled:  return 'text-white bg-black';
            case ReservationStatus.NoShow:     return 'text-gray-700 bg-gray-200 border border-gray-300';
            default:                           return 'text-gray-600 bg-gray-50 border border-gray-200';
        }
    };

    const getStatusLabel = (status: ReservationStatus) => {
        const labels = ['Pending', 'Confirmed', 'Checked In', 'Checked Out', 'Cancelled', 'No Show'];
        return labels[status] || 'Unknown';
    };

    return (
        <div className="space-y-6 md:space-y-8 pb-10 p-4 md:p-6 bg-gray-50 min-h-screen">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-black tracking-tight">
                        {t('dashboard.welcome', { name: 'Admin' })} 👋
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">{t('dashboard.subtitle')}</p>
                </div>
                {/* Indicador corporativo */}
                <div className="flex items-center gap-2 bg-green-700 text-white text-xs font-semibold px-4 py-2 rounded-full uppercase tracking-widest">
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Live
                </div>
            </div>

            {/* Row 1: Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard
                    title={t('dashboard.stats.totalRevenue')}
                    value={stats ? formatCurrency(stats.totalRevenue) : formatCurrency(0)}
                    icon={FaMoneyBillWave}
                    color="from-green-700 to-green-900"
                    trend={{ value: 21.5, isPositive: false }}
                    loading={isLoading}
                />
                <StatsCard
                    title={t('dashboard.stats.totalReservations')}
                    value={stats?.totalBookings || 0}
                    icon={FaCalendarCheck}
                    color="from-black to-gray-700"
                    trend={{ value: 21.5, isPositive: true }}
                    loading={isLoading}
                />
                <StatsCard
                    title={t('dashboard.stats.availableRooms')}
                    value={stats?.availableRooms || 0}
                    icon={FaBed}
                    color="from-green-500 to-green-700"
                    trend={{ value: 21.5, isPositive: false }}
                    loading={isLoading}
                />
                <StatsCard
                    title={t('dashboard.stats.occupancyRate')}
                    value={`${getOccupancyRate()}%`}
                    icon={FaChartLine}
                    color="from-gray-700 to-black"
                    trend={{ value: 21.5, isPositive: false }}
                    loading={isLoading}
                />
            </div>

            {/* Row 2: Data Overview & Revenue Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="lg:col-span-1 h-full">
                    <DataOverview />
                </div>
                <div className="lg:col-span-2 h-full">
                    <RevenueChart data={revenueData} />
                </div>
            </div>

            {/* Row 3: Sales, Performance, Recent Bookings */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <div className="h-full">
                    <SalesAnalytics />
                </div>
                <div className="h-full">
                    <PerformanceDevice />
                </div>

                {/* Recent Bookings */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-1 h-6 bg-green-700 rounded-full"></div>
                            <h3 className="font-bold text-lg text-black">{t('dashboard.recentBookings')}</h3>
                        </div>
                        <Link
                            to="/reservations"
                            className="text-sm text-green-700 font-semibold hover:text-green-900 flex items-center gap-1 transition-colors"
                        >
                            {t('dashboard.viewAll')} <FaArrowRight size={11} />
                        </Link>
                    </div>

                    <div className="space-y-3 flex-1">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <div key={i} className="flex gap-4 items-center animate-pulse">
                                    <div className="w-10 h-10 rounded-full bg-gray-100"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                                        <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                                    </div>
                                </div>
                            ))
                        ) : stats?.recentBookings?.length ? (
                            stats.recentBookings.slice(0, 4).map(booking => (
                                <div
                                    key={booking.id}
                                    className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-gray-200"
                                >
                                    {/* Avatar corporativo */}
                                    <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                        {booking.guestName.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-black truncate group-hover:text-green-700 transition-colors text-sm">
                                            {booking.guestName}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                            Room {booking.roomNumber}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-bold text-black text-sm">{formatCurrency(booking.totalPrice)}</p>
                                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}>
                                            {getStatusLabel(booking.status)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400 text-center py-4 text-sm">{t('dashboard.noRecentBookings')}</p>
                        )}
                    </div>

                    {/* Footer decorativo */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Últimas reservas del sistema</span>
                        <div className="w-6 h-1 bg-green-700 rounded-full"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;