import WorkingHourModal from '@/components/doctor-schedule/modals/working-hour-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { useModal } from '@/hooks/use-modal';
import { useCurrentClinic } from '@/queries/clinic.queries';
import {
  useCreateOffDay,
  useCreateWorkingHour,
  useDeleteOffDay,
  useDeleteWorkingHour,
  useOffDays,
  useUpdateWorkingHour,
  useWorkingHours,
} from '@/queries/doctor-schedule.queries';
import type { DoctorWorkingHour } from '@/types/api';
import { formatTimeShort } from '@/utils/date-format';
import dayjs from 'dayjs';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Edit2 from 'lucide-react/dist/esm/icons/edit-2';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import { useMemo, useState } from 'react';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';

const DAY_LABELS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export default function DoctorScheduleSettingsScreen() {
  const { data: clinic } = useCurrentClinic();
  const doctors = clinic?.doctors || [];

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors.length === 1 ? doctors[0].id : '',
  );

  const selectedDoc = doctors.find(
    (doc) => doc.id === selectedDoctorId || doctors[0].id,
  );
  const docId = selectedDoc?.id;

  const { data: workingHours, isLoading: whLoading } = useWorkingHours(docId);
  const { data: offDays, isLoading: odLoading } = useOffDays({
    doctorId: docId,
  });

  const createWorkingHourMutation = useCreateWorkingHour();
  const updateWorkingHourMutation = useUpdateWorkingHour();
  const deleteWorkingHourMutation = useDeleteWorkingHour();
  const createOffDayMutation = useCreateOffDay();
  const deleteOffDayMutation = useDeleteOffDay();

  // Group working hours by day_of_week
  const hoursByDay = useMemo(() => {
    const grouped: Record<number, DoctorWorkingHour[]> = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    if (workingHours) {
      for (const wh of workingHours) {
        if (!grouped[wh.day_of_week]) grouped[wh.day_of_week] = [];
        grouped[wh.day_of_week].push(wh);
      }
    }
    return grouped;
  }, [workingHours]);

  // Working Hour Dialog
  const whDialog = useModal();
  const [editingWH, setEditingWH] = useState<DoctorWorkingHour | null>(null);
  const [whForm, setWhForm] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '13:00',
    slotDuration: 15,
  });

  const openAddWH = (day: number) => {
    setEditingWH(null);
    setWhForm({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '13:00',
      slotDuration: 15,
    });
    whDialog.open();
  };

  const openEditWH = (wh: DoctorWorkingHour) => {
    setEditingWH(wh);
    setWhForm({
      dayOfWeek: wh.day_of_week,
      startTime: formatTimeShort(wh.start_time),
      endTime: formatTimeShort(wh.end_time),
      slotDuration: wh.slot_duration_minutes,
    });
    whDialog.open();
  };

  const handleSaveWH = async () => {
    if (!docId) return;
    if (whForm.endTime <= whForm.startTime) {
      toast.add({ title: 'End time must be after start time', type: 'error' });
      return;
    }

    try {
      if (editingWH) {
        await updateWorkingHourMutation.mutateAsync({
          id: editingWH.id,
          updates: {
            start_time: whForm.startTime,
            end_time: whForm.endTime,
            slot_duration_minutes: whForm.slotDuration,
          },
        });
        toast.add({ title: 'Working hour updated', type: 'success' });
      } else {
        await createWorkingHourMutation.mutateAsync({
          doctor_id: docId,
          day_of_week: whForm.dayOfWeek,
          start_time: whForm.startTime,
          end_time: whForm.endTime,
          slot_duration_minutes: whForm.slotDuration,
        });
        toast.add({ title: 'Working hour added', type: 'success' });
      }
      whDialog.close();
    } catch (error: any) {
      toast.add({
        title: error?.message || 'Failed to save working hour',
        type: 'error',
      });
    }
  };

  const handleDeleteWH = async (id: string) => {
    try {
      await deleteWorkingHourMutation.mutateAsync(id);
      toast.add({ title: 'Working hour deleted', type: 'success' });
    } catch (error: any) {
      toast.add({
        title: error?.message || 'Failed to delete',
        type: 'error',
      });
    }
  };

  // Off Day form
  const [offDayDate, setOffDayDate] = useState('');
  const [offDayReason, setOffDayReason] = useState('');

  const handleAddOffDay = async () => {
    if (!docId || !offDayDate) {
      toast.add({ title: 'Please select a date', type: 'error' });
      return;
    }

    try {
      await createOffDayMutation.mutateAsync({
        doctor_id: docId,
        date: offDayDate,
        reason: offDayReason || undefined,
      });
      toast.add({ title: 'Off day added', type: 'success' });
      setOffDayDate('');
      setOffDayReason('');
    } catch (error: any) {
      toast.add({
        title: error?.message || 'Failed to add off day',
        type: 'error',
      });
    }
  };

  const handleDeleteOffDay = async (id: string) => {
    try {
      await deleteOffDayMutation.mutateAsync(id);
      toast.add({ title: 'Off day removed', type: 'success' });
    } catch (error: any) {
      toast.add({
        title: error?.message || 'Failed to delete',
        type: 'error',
      });
    }
  };

  const loading = whLoading || odLoading;

  return (
    <div className="h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header */}
        <div className="mb-4 md:mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h6 className="text-sm md:text-sm font-medium text-foreground flex items-center gap-2">
                <ClipboardList className="size-4" /> Doctor Schedule
              </h6>
            </div>
            {doctors.length > 0 && (
              <div className="max-w-xs">
                <Select.Root
                  value={docId}
                  onValueChange={(value) => setSelectedDoctorId(value ?? '')}
                >
                  <Select.Trigger className="w-full">
                    <Select.Value placeholder="Select doctor">
                      {selectedDoc?.name}
                    </Select.Value>
                  </Select.Trigger>
                  <Select.Popup>
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
        </div>

        {!docId ? (
          <Card.Root className="">
            <Card.Panel className="p-12 text-center">
              <p className="text-gray-500">
                Please select a doctor to manage their schedule
              </p>
            </Card.Panel>
          </Card.Root>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-500">Loading schedule...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Working Hours Section */}
            <div>
              <h6 className="text-sm md:text-sm mb-3 font-medium text-foreground flex items-center gap-2">
                Weekly Working Hours
              </h6>
              <div className="grid md:grid-cols-3 gap-3">
                {DAY_LABELS.map((dayLabel, dayIndex) => {
                  const hours = hoursByDay[dayIndex] || [];
                  return (
                    <Card.Root key={dayIndex} className="border-gray-200">
                      <Card.Panel className="p-3 md:p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">
                              {dayLabel}
                            </p>
                            {hours.length > 0 ? (
                              <div className="mt-1 space-y-1">
                                {hours.map((wh) => (
                                  <div
                                    key={wh.id}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <span>
                                      {formatTimeShort(wh.start_time)} -{' '}
                                      {formatTimeShort(wh.end_time)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                      ({wh.slot_duration_minutes} min slots)
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openEditWH(wh)}
                                      className="text-gray-400 hover:text-teal-600 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteWH(wh.id)}
                                      className="text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 mt-1">
                                No hours set
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAddWH(dayIndex)}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                          </Button>
                        </div>
                      </Card.Panel>
                    </Card.Root>
                  );
                })}
              </div>
            </div>

            {/* Off Days Section */}
            <div>
              <h6 className="text-sm md:text-sm mb-3 font-medium text-foreground flex items-center gap-2">
                Off Days / Holidays
              </h6>

              {/* Add Off Day Form */}
              <Card.Root className="border-gray-200 mb-3">
                <Card.Panel className="p-3 md:p-4">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="sm:w-44">
                      <DatePicker
                        value={offDayDate}
                        onChange={(value) => setOffDayDate(value)}
                        placeholder="Select date"
                        className="w-full text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Reason (optional)"
                        value={offDayReason}
                        onChange={(e) => setOffDayReason(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleAddOffDay}
                      disabled={!offDayDate || createOffDayMutation.isPending}
                      loading={createOffDayMutation.isPending}
                    >
                      <Plus className="w-5 h-5 mr-1" strokeWidth={2} />
                    </Button>
                  </div>
                </Card.Panel>
              </Card.Root>

              {/* Off Days List */}
              {offDays && offDays.length > 0 ? (
                <div className=" grid md:grid-cols-3 gap-3">
                  {offDays.map((od) => (
                    <Card.Root key={od.id} className="border-gray-200">
                      <Card.Panel className="p-3 md:p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {dayjs(od.date).format('ddd, DD MMM YYYY')}
                            </p>
                            {od.reason && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {od.reason}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteOffDay(od.id)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Card.Panel>
                    </Card.Root>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No off days scheduled</p>
              )}
            </div>
          </div>
        )}
      </div>

      <WorkingHourModal
        open={whDialog.isOpen}
        editing={Boolean(editingWH)}
        dayLabels={DAY_LABELS}
        value={whForm}
        onChange={setWhForm}
        onClose={whDialog.close}
        onSave={handleSaveWH}
        isSaving={
          createWorkingHourMutation.isPending ||
          updateWorkingHourMutation.isPending
        }
      />
    </div>
  );
}
