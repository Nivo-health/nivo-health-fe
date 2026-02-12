import { QuickActionButton } from '@/components/dashboard/quick-action-button';
import { StatCard } from '@/components/dashboard/stats-card';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { toast } from '@/components/ui/toast';
import { useFilters } from '@/hooks/use-filters';
import dayjs from 'dayjs';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import Clock from 'lucide-react/dist/esm/icons/clock';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import Users from 'lucide-react/dist/esm/icons/users';
import { useNavigate } from 'react-router-dom';
import { useClinic } from '../hooks/use-clinic';
import { useClinicStats } from '../queries/clinic.queries';

const today = dayjs().format('YYYY-MM-DD');

export default function HomeScreen() {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const clinicName = clinic?.name || 'Clinic OPD Management';

  const { values, updateFilter } = useFilters({
    initialValue: {
      startDate: today,
      endDate: today,
    },
    useQueryParams: true,
  });

  const { startDate, endDate } = values;

  const { data: statsData, isLoading: loading } = useClinicStats({
    start: startDate,
    end: endDate,
  });

  const validateRange = (start: string, end: string) => {
    if (start > end) {
      toast.add({
        title: 'Start date cannot be after end date',
        type: 'error',
      });
      return false;
    }
    return true;
  };

  const handleStartDateChange = (value: string | null) => {
    if (!value) return;

    if (!validateRange(value, endDate)) return;

    updateFilter('startDate', value);
  };

  const handleEndDateChange = (value: string | null) => {
    if (!value) return;

    if (!validateRange(startDate, value)) return;

    updateFilter('endDate', value);
  };

  const stats = {
    totalPatients: statsData?.total_patients || 0,
    totalVisits: statsData?.total_visits || 0,
    totalCompletedVisits: statsData?.total_completed_visits || 0,
    totalInProgressVisits: statsData?.total_in_progress_visits || 0,
    totalAppointments: statsData?.total_appointments || 0,
    totalPendingVisits: statsData?.total_pending_visits || 0,
    totalPendingAppointments: statsData?.total_pending_appointments || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Compact on Mobile */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {clinicName}
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  OPD Management System
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                className="w-full sm:w-36"
              />
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                className="w-full sm:w-36"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Greeting Banner */}
        <div className="mb-6 lg:mb-8">
          <div
            className="relative overflow-hidden rounded-2xl p-6 lg:p-8 text-accent"
            style={{
              background: 'var(--gradient-primary)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="relative z-10">
              <h2 className="text-2xl lg:text-3xl font-bold italic text-dashboard-foreground mb-2">
                Good {getGreeting()}, Doctor!
              </h2>
              <p className="text-dashboard-foreground/80 max-w-lg">
                You have{' '}
                <span className="font-semibold text-dashboard-foreground">
                  {stats.totalPendingVisits} patients
                </span>{' '}
                waiting and{' '}
                <span className="font-semibold text-dashboard-foreground">
                  {stats.totalPendingAppointments} appointments
                </span>{' '}
                scheduled today.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-64 h-64 opacity-10">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <circle
                  cx="100"
                  cy="100"
                  r="80"
                  fill="currentColor"
                  className="text-dashboard-foreground"
                />
                <circle
                  cx="150"
                  cy="50"
                  r="40"
                  fill="currentColor"
                  className="text-dashboard-foreground"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Patients + Quick Actions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-1">
            <StatCard
              title="Total Patients"
              value={stats.totalPatients.toLocaleString()}
              subtitle="Registered in system"
              icon={<Users className="w-4 h-4 text-primary" />}
              loading={loading}
            />
          </div>
          {/* Quick Actions */}
          <div className="lg:col-span-3">
            <Card.Root className="overflow-hidden border-primary/10 ">
              <Card.Header
                className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
                style={{
                  background: 'var(--gradient-header)',
                }}
              >
                <Card.Title className="text-sm font-medium text-muted-foreground">
                  Quick Actions
                </Card.Title>
              </Card.Header>
              <Card.Panel className="px-4 relative">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <QuickActionButton
                    icon={<CalendarDays className="w-5 h-5 text-blue-400" />}
                    label="Manage Appointments"
                    onClick={() => navigate('/appointments')}
                  />
                  <QuickActionButton
                    icon={<ClipboardList className="w-5 h-5 text-orange-400" />}
                    label="View Patient Queue"
                    onClick={() => navigate('/visits')}
                  />
                  <QuickActionButton
                    icon={<UserPlus className="w-5 h-5 text-primary" />}
                    label="Register Patient"
                    onClick={() => navigate('/patients')}
                  />
                </div>
              </Card.Panel>
            </Card.Root>
          </div>
        </div>

        {/* Visits Overview Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-dashboard-accent-foreground">
              Visits Overview
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <StatCard
              title="Total Visits"
              value={stats.totalVisits.toLocaleString()}
              subtitle="All time"
              icon={<TrendingUp className="w-4 h-4 text-primary" />}
              loading={loading}
            />

            <StatCard
              title="In Progress"
              value={stats.totalInProgressVisits.toLocaleString()}
              subtitle="Currently active"
              icon={<Clock className="w-4 h-4 text-orange-500" />}
              loading={loading}
            />

            <StatCard
              title="Completed"
              value={stats.totalCompletedVisits.toLocaleString()}
              subtitle="Successfully finished"
              icon={<CheckCircle className="w-4 h-4 text-green-700" />}
              loading={loading}
            />

            <StatCard
              title="Pending"
              value={stats.totalPendingVisits.toLocaleString()}
              subtitle="Awaiting attention"
              icon={<Clock className="w-4 h-4 text-blue-400" />}
              loading={loading}
            />
          </div>
        </div>

        {/* Appointments Section */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full bg-primary" />
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-dashboard-accent-foreground">
              Appointments
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            <StatCard
              title="Total Appointments"
              value={stats.totalAppointments.toLocaleString()}
              subtitle="Scheduled"
              icon={<Calendar className="w-4 h-4 text-primary" />}
              loading={loading}
            />
            <StatCard
              title="Pending Today"
              value={stats.totalPendingAppointments.toLocaleString()}
              subtitle="Need confirmation"
              icon={<Clock className="w-4 h-4 text-orange-500" />}
              loading={loading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
function getGreeting(): string {
  const hour = dayjs().hour();
  if (hour < 12) return 'Morning';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}
