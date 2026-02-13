import CreateAppointmentDialog from '@/components/dashboard/create-appointment-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useFilters } from '@/hooks';
import { useModal } from '@/hooks/use-modal';
import {
  useAppointments,
  useUpdateAppointmentStatus,
} from '@/queries/appointments.queries';
import { useCurrentClinic } from '@/queries/clinic.queries';
import { formatTimeShort } from '@/utils/date-format';
import type { Appointment } from '@/types';
import dayjs from 'dayjs';
import { useMemo } from 'react';

export default function AppointmentsScreen() {
  const { data: clinic } = useCurrentClinic();
  const doctors = clinic?.doctors || [];
  const updateAppointmentStatusMutation = useUpdateAppointmentStatus();
  const createAppointmentsModal = useModal();

  const { values, updateFilter, updateMultipleFilters } = useFilters({
    initialValue: {
      SEARCH: '',
      DATE: dayjs().format('YYYY-MM-DD'),
      DOCTOR_ID: '',
      PAGE: 1,
      PAGE_SIZE: 20,
    },
    useQueryParams: true,
  });

  const doctorId =
    values.DOCTOR_ID && values.DOCTOR_ID !== 'all'
      ? values.DOCTOR_ID
      : undefined;

  const { data: appointmentsResult, isLoading: loading } = useAppointments({
    page: values.PAGE,
    pageSize: values.PAGE_SIZE,
    date: values.DATE,
    doctorId: doctorId,
  });

  const totalCount = appointmentsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / values.PAGE_SIZE));
  const filteredAppointments = useMemo(() => {
    const appointments = appointmentsResult?.appointments || [];
    if (!values.SEARCH.trim()) return appointments;
    const query = values.SEARCH.toLowerCase();
    return appointments.filter((appointment) => {
      const nameMatch = appointment.name?.toLowerCase().includes(query);
      const mobileMatch = appointment.mobile_number?.includes(query);
      return nameMatch || mobileMatch;
    });
  }, [values.SEARCH, appointmentsResult]);

  const handleCreateAppointment = () => {
    createAppointmentsModal.open();
  };

  const handleMarkCheckIn = async (
    appointmentId: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    await toast.promise(
      updateAppointmentStatusMutation.mutateAsync({
        appointmentId,
        status: 'CHECKED_IN',
      }),
      {
        loading: 'Marking appointment as checked in...',
        success: 'Appointment marked as checked in',
        error: (err) => err?.message || 'Failed to mark check in',
      },
    );
  };

  const formatAppointmentTime = (appointment: Appointment) => {
    if (appointment.slot) {
      const date = dayjs(appointment.slot.date).format('DD MMM YYYY');
      const time = formatTimeShort(appointment.slot.start_time);
      return `${date} | ${time}`;
    }
    if (appointment.appointment_date_time) {
      try {
        return dayjs(appointment.appointment_date_time).format(
          'DD MMM YYYY | hh:mm A',
        );
      } catch {
        return appointment.appointment_date_time;
      }
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting') return 'bg-yellow-100 text-yellow-800';
    if (s === 'checked_in') return 'bg-teal-100 text-teal-800';
    if (s === 'no_show') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'waiting') return 'Waiting';
    if (s === 'checked_in') return 'Checked In';
    if (s === 'no_show') return 'No Show';
    return status;
  };

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading appointments...</div>
      </div>
    );
  }

  const selectedDoc = doctors.find((doc) => doc.id === values.DOCTOR_ID);

  return (
    <div className="h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-foreground">
                Appointments
              </h1>
              <p className="text-xs md:text-base text-muted-foreground mt-1">
                {filteredAppointments.length}{' '}
                {filteredAppointments.length === 1
                  ? 'appointment'
                  : 'appointments'}
                {values.SEARCH && ` found`}
              </p>
            </div>
            <Button onClick={handleCreateAppointment} size="sm">
              + Create
            </Button>
          </div>
        </div>

        {/* Filters - Compact on Mobile */}
        <div className="mb-4 md:mb-6 flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name or mobile..."
              defaultValue={values.SEARCH}
              onChange={(e) => updateFilter('SEARCH', e.target.value)}
            />
          </div>
          <div className="sm:w-40 md:w-48">
            <DatePicker
              value={values.DATE}
              onChange={(value) => {
                updateMultipleFilters({ DATE: value, PAGE: 1 });
              }}
              placeholder="Select date"
              className="w-full text-sm"
            />
          </div>
          {doctors.length > 0 && (
            <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
              <Select.Root
                value={values.DOCTOR_ID || undefined}
                onValueChange={(value) => {
                  updateMultipleFilters({ DOCTOR_ID: value || '', PAGE: 1 });
                }}
              >
                <Select.Trigger className="w-full text-sm">
                  <Select.Value placeholder="All Doctors">
                    {selectedDoc?.name}
                  </Select.Value>
                </Select.Trigger>

                <Select.Popup>
                  <Select.Item value="all">All Doctors</Select.Item>

                  {doctors.map((doc) => (
                    <Select.Item key={doc.id} value={doc.id}>
                      {doc.name}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="text-xs md:text-sm text-gray-600">
            Page {values.PAGE} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE - 1))}
              disabled={values.PAGE <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE + 1))}
              disabled={values.PAGE >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>

        {filteredAppointments.length > 0 ? (
          <div className="grid gap-3">
            {filteredAppointments.map((appointment) => (
              <Card.Root
                key={appointment.id}
                className="border-teal-200 hover:border-teal-400 hover:shadow-lg transition-all"
              >
                <Card.Panel className="p-3 md:p-5">
                  <div className="flex items-center md:items-start gap-3 md:gap-4">
                    {/* Avatar */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-linear-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg shrink-0">
                      {appointment.name?.charAt(0).toUpperCase() || '?'}
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Mobile View - Stacked */}
                      <div className="md:hidden space-y-2">
                        {/* Name and Status Row */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate flex-1">
                            {appointment.name || 'Unknown'}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${getStatusColor(appointment.appointment_status)}`}
                          >
                            {getStatusLabel(appointment.appointment_status)}
                          </span>
                        </div>

                        {/* Mobile Number */}
                        {appointment.mobile_number && (
                          <div className="text-sm text-muted-foreground">
                            Mobile: {appointment.mobile_number}
                          </div>
                        )}

                        {/* Doctor */}
                        {appointment.doctor && (
                          <div className="text-sm text-muted-foreground">
                            Doctor: {appointment.doctor.name}
                          </div>
                        )}

                        {/* Appointment Time */}
                        {formatAppointmentTime(appointment) && (
                          <div className="text-sm text-muted-foreground">
                            Time: {formatAppointmentTime(appointment)}
                          </div>
                        )}

                        {/* Check In Button - Mobile */}
                        {appointment.appointment_status === 'WAITING' && (
                          <div className="pt-1">
                            <Button
                              disabled={
                                updateAppointmentStatusMutation.isPending
                              }
                              size="sm"
                              onClick={(e) =>
                                handleMarkCheckIn(appointment.id, e)
                              }
                              className="w-full"
                            >
                              Mark Check In
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Desktop View - Column-based layout */}
                      <div className="hidden md:flex items-center gap-4 w-full">
                        <div className="flex-1 min-w-0 grid grid-cols-[minmax(150px,1fr)_minmax(80px,auto)_minmax(180px,auto)_minmax(200px,auto)] gap-4 items-center">
                          {/* Name Column */}
                          <div className="min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">
                              {appointment.name || 'Unknown'}
                            </h3>
                          </div>

                          {/* Mobile Column */}
                          <div className="min-w-0">
                            {appointment.mobile_number ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {appointment.mobile_number}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>

                          {/* Doctor Column */}
                          <div className="min-w-0">
                            {appointment.doctor ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {appointment.doctor.name}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>

                          {/* Appointment Time Column */}
                          <div className="min-w-0">
                            {formatAppointmentTime(appointment) ? (
                              <span className="text-sm text-gray-600 whitespace-nowrap">
                                {formatAppointmentTime(appointment)}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </div>
                        </div>

                        {/* Status Badge and Check In Button - Desktop */}
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(appointment.appointment_status)}`}
                          >
                            {getStatusLabel(appointment.appointment_status)}
                          </span>
                          {appointment.appointment_status === 'WAITING' && (
                            <Button
                              size="sm"
                              disabled={
                                updateAppointmentStatusMutation.isPending
                              }
                              onClick={(e) =>
                                handleMarkCheckIn(appointment.id, e)
                              }
                              className="whitespace-nowrap"
                            >
                              Mark Check In
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card.Panel>
              </Card.Root>
            ))}
          </div>
        ) : (
          <Card.Root className="border-teal-200">
            <Card.Panel className="p-12 text-center">
              <div className="text-gray-500">
                {values.SEARCH ? (
                  <>
                    <p className="text-lg font-medium mb-2">
                      No appointments found
                    </p>
                    <p className="text-sm">Try a different search term</p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      No appointments yet
                    </p>
                    <p className="text-sm">Appointments will appear here</p>
                  </>
                )}
              </div>
            </Card.Panel>
          </Card.Root>
        )}
      </div>

      <CreateAppointmentDialog {...createAppointmentsModal} />
    </div>
  );
}
