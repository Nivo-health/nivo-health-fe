import CreateAppointmentDialog from '@/components/dashboard/create-appointment-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useFilters } from '@/hooks';
import { useModal } from '@/hooks/use-modal';
import { cn } from '@/lib/utils';
import {
  useAppointments,
  useUpdateAppointmentStatus,
} from '@/queries/appointments.queries';
import { useCurrentClinic } from '@/queries/clinic.queries';
import { type Appointment } from '@/types/api';
import { formatTimeShort } from '@/utils/date-format';
import dayjs from 'dayjs';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import { useMemo } from 'react';
import { DataTable } from '@/components/ui/table-ui';
import { ColumnDef } from '@tanstack/react-table';
import { APPOINTMENT_STATUS } from '@/constants/api';

const STATUS_LABEL = {
  WAITING: 'Waiting',
  CHECKED_IN: 'Checked In',
  NO_SHOW: 'No Show',
} as const;

const useMarkCheckIn = () => {
  const updateAppointmentStatusMutation = useUpdateAppointmentStatus();

  const handleMarkCheckIn = async (
    e: React.MouseEvent,
    appointmentId: string,
  ) => {
    e.stopPropagation();

    await toast.promise(
      updateAppointmentStatusMutation.mutateAsync({
        appointmentId,
        status: APPOINTMENT_STATUS.CHECKED_IN,
      }),
      {
        loading: 'Marking appointment as checked in...',
        success: 'Appointment marked as checked in',
        error: (err) => err?.message || 'Failed to mark check in',
      },
    );
  };

  return { handleMarkCheckIn, ...updateAppointmentStatusMutation };
};

const Lable = ({ status }: { status: keyof typeof APPOINTMENT_STATUS }) => {
  return (
    <span
      className={cn(`px-2 py-1 rounded-full text-xs text-white`, {
        'bg-yellow-500': status === APPOINTMENT_STATUS.WAITING,
        'bg-primary': status === APPOINTMENT_STATUS.CHECKED_IN,
        'bg-red-800': status === APPOINTMENT_STATUS.NO_SHOW,
      })}
    >
      {STATUS_LABEL[status]}
    </span>
  );
};

const CheckIn = ({ appointment }: { appointment: Appointment }) => {
  const { handleMarkCheckIn, ...updateAppointmentStatusMutation } =
    useMarkCheckIn();

  if (appointment.appointment_status === APPOINTMENT_STATUS.WAITING) {
    return (
      <Button
        size="xs"
        variant="outline"
        disabled={updateAppointmentStatusMutation.isPending}
        onClick={(e) => handleMarkCheckIn(e, appointment.id)}
        className="ml-2"
      >
        Check In
      </Button>
    );
  }

  return null;
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
  return '-';
};

export const appointmentColumns: ColumnDef<Appointment>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
    cell: ({ getValue }) => (
      <span className="block truncate capitalize text-xs">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'mobile_number',
    header: 'Mobile',
    size: 150,
    cell: ({ getValue }) => (
      <span className="block truncate  text-xs">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'doctor.name',
    header: 'Doctor',
    size: 180,
    cell: ({ getValue }) => (
      <span className="block truncate capitalize text-xs">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'slot',
    header: 'Time',
    size: 180,
    cell: ({ row: { original } }) => (
      <span className="block truncate capitalize text-xs">
        {formatAppointmentTime(original)}
      </span>
    ),
  },
  {
    accessorKey: 'appointment_status',
    header: ' Status',
    size: 100,
    cell: ({ row: { original } }) => {
      const { appointment_status } = original;
      return (
        <span className="block justify-between">
          <Lable status={appointment_status} />
        </span>
      );
    },
  },
  {
    accessorKey: 'appointment_status',
    header: ' Status',
    size: 100,
    cell: ({ row: { original } }) => {
      return (
        <span className="block justify-between">
          <CheckIn appointment={original} />
        </span>
      );
    },
  },
];

export default function AppointmentsScreen() {
  const { data: clinic } = useCurrentClinic();
  const doctors = clinic?.doctors || [];
  const createAppointmentsModal = useModal();
  const { handleMarkCheckIn, ...updateAppointmentStatusMutation } =
    useMarkCheckIn();

  const { values, updateFilter, updateMultipleFilters } = useFilters({
    initialValue: {
      SEARCH: '',
      DATE: '',
      DOCTOR_ID: 'ALL',
      PAGE: 1,
      PAGE_SIZE: 20,
    },
    useQueryParams: true,
  });

  const doctorId =
    values.DOCTOR_ID && values.DOCTOR_ID !== 'ALL'
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

  const selectedDoc = doctors.find((doc) => doc.id === values.DOCTOR_ID);

  return (
    <div className="h-screen bg-background overflow-x-hidden md:pb-0 pb-24">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h6 className="text-sm md:text-sm font-medium text-foreground flex items-center gap-2">
                <CalendarDays className="size-4" /> Appointments
              </h6>
            </div>
            <Button onClick={createAppointmentsModal.open} size="sm">
              + Create
            </Button>
          </div>
        </div>

        {/* Filters - Compact on Mobile */}
        <div className="mb-3 flex flex-col sm:flex-row gap-2 md:gap-4">
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
                value={values.DOCTOR_ID}
                onValueChange={(value) => {
                  updateMultipleFilters({ DOCTOR_ID: value || '', PAGE: 1 });
                }}
              >
                <Select.Trigger className="w-full text-sm">
                  <Select.Value placeholder="All Doctors">
                    {selectedDoc?.name || 'All Doctors'}
                  </Select.Value>
                </Select.Trigger>

                <Select.Popup>
                  <Select.Item value="ALL">All Doctors</Select.Item>
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
              size="xs"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE - 1))}
              disabled={values.PAGE <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE + 1))}
              disabled={values.PAGE >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="h-96 bg-background flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {filteredAppointments.length > 0 ? (
              <>
                {/* Desktop Table  View */}
                <div className="md:block hidden">
                  <DataTable<Appointment>
                    data={filteredAppointments}
                    columns={appointmentColumns}
                  />
                </div>

                {/* Mobile card view */}
                <div className="md:hidden grid gap-2 ">
                  {filteredAppointments.map((appointment) => (
                    <Card.Root
                      key={appointment.id}
                      className="border-neutral-200 transition-all md:border-0"
                    >
                      <Card.Panel className="p-3">
                        <div className="flex-1 min-w-0">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-base text-neutral-800 line-clamp-2 block capitalize">
                                {appointment.name || 'Unknown'}
                              </span>
                              {appointment.appointment_status ===
                                APPOINTMENT_STATUS.WAITING && (
                                <Button
                                  disabled={
                                    updateAppointmentStatusMutation.isPending
                                  }
                                  size="xs"
                                  onClick={(e) =>
                                    handleMarkCheckIn(e, appointment.id)
                                  }
                                  variant="outline"
                                >
                                  Check In
                                </Button>
                              )}
                            </div>

                            {appointment.mobile_number && (
                              <div className="text-xs text-muted-foreground">
                                Mobile: {appointment.mobile_number}
                              </div>
                            )}

                            {appointment.doctor && (
                              <div className="text-xs text-muted-foreground capitalize">
                                Doctor: {appointment.doctor.name}
                              </div>
                            )}
                            <div className="flex items-start justify-between gap-2">
                              {formatAppointmentTime(appointment) && (
                                <div className="text-xs text-muted-foreground">
                                  Time: {formatAppointmentTime(appointment)}
                                </div>
                              )}
                              <Lable status={appointment.appointment_status} />
                            </div>
                          </div>
                        </div>
                      </Card.Panel>
                    </Card.Root>
                  ))}
                </div>
              </>
            ) : (
              <Card.Root className="border-teal-200">
                <Card.Panel className="p-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">
                      No appointments found
                    </p>
                  </div>
                </Card.Panel>
              </Card.Root>
            )}
          </>
        )}
      </div>

      <CreateAppointmentDialog {...createAppointmentsModal} />
    </div>
  );
}
