import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, DatePicker } from '../components/ui_old';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui_old/Card';
import { useClinic } from '../hooks/useClinic';
import { clinicService } from '../services/clinicService';
import { toast } from '@/utils/toast';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { clinic } = useClinic();
  const clinicName = clinic?.name || 'Clinic OPD Management';

  // Date range state - default to today
  const [startDate, setStartDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalVisits: 0,
    totalCompletedVisits: 0,
    totalInProgressVisits: 0,
    totalAppointments: 0,
    totalPendingVisits: 0,
    totalPendingAppointments: 0,
  });

  useEffect(() => {
    loadStats();
  }, [startDate, endDate]); // Reload when date range changes

  const loadStats = async () => {
    try {
      setLoading(true);

      console.log('🔄 Loading clinic stats...', { startDate, endDate });
      const statsData = await clinicService.getStats(undefined, {
        start: startDate,
        end: endDate,
      });

      if (statsData) {
        console.log('✅ Clinic stats loaded:', statsData);
        setStats({
          totalPatients: statsData.total_patients || 0,
          totalVisits: statsData.total_visits || 0,
          totalCompletedVisits: statsData.total_completed_visits || 0,
          totalInProgressVisits: statsData.total_in_progress_visits || 0,
          totalAppointments: statsData.total_appointments || 0,
          totalPendingVisits: statsData.total_pending_visits || 0,
          totalPendingAppointments: statsData.total_pending_appointments || 0,
        });
      } else {
        console.error('❌ Failed to load clinic stats');
      }
    } catch (error) {
      console.error('❌ Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-3 md:p-6 overflow-x-hidden w-full">
      <Button>Button</Button>
      <div className="max-w-7xl mx-auto w-full">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 md:mb-4 w-full">
            <div className="flex-1 min-w-0 w-full sm:w-auto">
              <h1 className="text-xl md:text-3xl font-bold text-teal-900 truncate">
                Welcome to {clinicName}
              </h1>
              <p className="text-xs md:text-base text-gray-600 mt-1 hidden sm:block">
                Manage your outpatient department efficiently
              </p>
            </div>
            {/* Date Range Filter - Right Corner */}
            <div className="flex flex-row gap-2 flex-shrink-0 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-32 md:w-36 min-w-0">
                <DatePicker
                  value={startDate}
                  onChange={(value) => {
                    if (value) {
                      setStartDate(value);
                      // If end date is before start date, update end date
                      if (endDate && value > endDate) {
                        setEndDate(value);
                      }
                    }
                  }}
                  placeholder="Start date"
                  className="w-full text-sm"
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-32 md:w-36 min-w-0">
                <DatePicker
                  value={endDate}
                  onChange={(value) => {
                    if (value) {
                      setEndDate(value);
                      // If start date is after end date, update start date
                      if (startDate && value < startDate) {
                        setStartDate(value);
                      }
                    }
                  }}
                  placeholder="End date"
                  className="w-full text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Overview Stats - Total Patients and Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6 mb-4 md:mb-6 w-full">
          <Card className="border-teal-200 hover:shadow-md transition-shadow h-full flex flex-col w-full min-w-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
              <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                Total Patients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6 flex-1 flex flex-col justify-center">
              <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                {loading ? '...' : stats.totalPatients}
              </div>
              <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                Registered
              </p>
            </CardContent>
          </Card>
          <Card className="border-teal-200 h-full flex flex-col w-full min-w-0">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
              <CardTitle className="text-teal-900 text-xs md:text-sm md:text-base truncate">
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6 flex-1 flex flex-col justify-center min-w-0">
              <div className="grid grid-cols-3 md:grid-cols-1 gap-2 md:gap-3 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col md:flex-row items-center justify-center md:justify-start h-16 md:h-auto md:py-3 text-xs md:text-sm gap-2"
                  onClick={() => navigate('/appointments')}
                >
                  <span className="text-lg md:text-xl md:mb-0 mb-1">📅</span>
                  <span>Appointments</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col md:flex-row items-center justify-center md:justify-start h-16 md:h-auto md:py-3 text-xs md:text-sm gap-2"
                  onClick={() => navigate('/visits')}
                >
                  <span className="text-lg md:text-xl md:mb-0 mb-1">👥</span>
                  <span>Queue</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex flex-col md:flex-row items-center justify-center md:justify-start h-16 md:h-auto md:py-3 text-xs md:text-sm gap-2"
                  onClick={() => navigate('/patients')}
                >
                  <span className="text-lg md:text-xl md:mb-0 mb-1">👤</span>
                  <span>Patients</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - First Row After Total Patients */}

        {/* Visits Section */}
        <div className="mb-4 md:mb-6 w-full">
          <h2 className="text-lg md:text-xl font-semibold text-teal-900 mb-3 md:mb-4">
            Visits
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6 w-full">
            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  Total Visits
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalVisits}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalInProgressVisits}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  Active
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalCompletedVisits}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  Finished
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalPendingVisits}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  Waiting
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="mb-4 md:mb-6 w-full">
          <h2 className="text-lg md:text-xl font-semibold text-teal-900 mb-3 md:mb-4">
            Appointments
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 lg:gap-6 w-full">
            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  Total Appointments
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalAppointments}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  All time
                </p>
              </CardContent>
            </Card>

            <Card className="border-teal-200 hover:shadow-md transition-shadow w-full min-w-0">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-white border-b border-teal-100 py-2 md:py-3">
                <CardTitle className="text-teal-900 text-xs md:text-sm truncate">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 md:pt-6 pb-3 md:pb-6">
                <div className="text-2xl md:text-3xl font-bold text-teal-600 truncate">
                  {loading ? '...' : stats.totalPendingAppointments}
                </div>
                <p className="text-xs md:text-sm text-gray-600 mt-1 truncate">
                  Waiting
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
