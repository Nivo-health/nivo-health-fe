import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { ModalControl } from '@/hooks/useModal';
import { useCurrentClinic } from '@/queries/clinic.queries';
import { usePatientSearchLazy } from '@/queries/patients.queries';
import { useAvailableSlots, useBookSlot } from '@/queries/slots.queries';
import { bookSlotSchema } from '@/schema/book-slot.schema';
import { mobileSearchSchema } from '@/schema/mobile-search-schema';
import type { AvailableSlot, Patient } from '@/types';
import {
  getErrorMessage,
  hasValidationErrors,
  extractValidationErrors,
} from '@/utils/errorHandler';
import {
  formatTimeShort,
  getSlotDateRange,
  groupSlotsByPeriod,
} from '@/utils/dateFormat';
import { formatPhoneInput } from '@/utils/phoneValidation';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RadioGroup } from '../ui/radio-group';

type CreateAppointmentDialogProps = ModalControl;
type MobileSearchForm = z.infer<typeof mobileSearchSchema>;
type BookSlotForm = z.infer<typeof bookSlotSchema>;

type Step = 'mobile' | 'slot-picker' | 'patient-form';

export default function CreateAppointmentDialog(
  props: CreateAppointmentDialogProps,
) {
  const { data: clinic } = useCurrentClinic();
  const doctors = clinic?.doctors || [];
  const bookSlotMutation = useBookSlot();
  const [step, setStep] = useState<Step>('mobile');
  const patientSearchLazy = usePatientSearchLazy();

  const searching = patientSearchLazy.isPending;
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  // Slot picker state
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>(
    doctors.length === 1 ? doctors[0].id : '',
  );
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const dateRange = useMemo(() => getSlotDateRange(), []);

  const { data: slotsData, isLoading: slotsLoading } = useAvailableSlots({
    doctorId: selectedDoctorId,
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Build a set of dates that have available slots
  const availableDates = useMemo(() => {
    const dates = new Map<string, AvailableSlot[]>();
    if (slotsData?.days) {
      for (const day of slotsData.days) {
        if (day.slots.length > 0) {
          dates.set(day.date, day.slots);
        }
      }
    }
    return dates;
  }, [slotsData]);

  // Generate next 14 days for calendar
  const calendarDays = useMemo(() => {
    const days: { date: string; label: string; dayName: string }[] = [];
    for (let i = 0; i < 14; i++) {
      const d = dayjs().add(i, 'day');
      days.push({
        date: d.format('YYYY-MM-DD'),
        label: d.format('DD'),
        dayName: d.format('ddd'),
      });
    }
    return days;
  }, []);

  // Slots for selected date
  const slotsForDate = useMemo(() => {
    if (!selectedDate) return null;
    const slots = availableDates.get(selectedDate);
    if (!slots) return null;
    return groupSlotsByPeriod(slots);
  }, [selectedDate, availableDates]);

  const mobileForm = useForm<MobileSearchForm>({
    resolver: zodResolver(mobileSearchSchema),
    defaultValues: { mobile: '' },
  });

  const patientForm = useForm<BookSlotForm>({
    resolver: zodResolver(bookSlotSchema),
    defaultValues: {
      name: '',
      mobile: '',
      gender: undefined,
      source: 'PHONE',
    },
  });

  const handleSearchPatient = async (data: MobileSearchForm) => {
    try {
      const result = await patientSearchLazy.mutateAsync({
        query: data.mobile,
        limit: 20,
      });

      const searchResults = result || [];

      if (searchResults.length > 0) {
        const patient = searchResults[0];
        setFoundPatient(patient);
        const genderMap: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
          M: 'MALE',
          F: 'FEMALE',
        };
        patientForm.reset({
          name: patient.name || '',
          mobile: patient.mobile || data.mobile,
          gender: genderMap[patient.gender || ''] || undefined,
          source: 'PHONE',
        });
      } else {
        setFoundPatient(null);
        patientForm.reset({
          name: '',
          mobile: data.mobile,
          gender: undefined,
          source: 'PHONE',
        });
      }

      // Auto-select doctor if only one
      if (doctors.length === 1) {
        setSelectedDoctorId(doctors[0].id);
      }
      setStep('slot-picker');
    } catch {
      toast.add({ title: 'Failed to search patient', type: 'error' });
    }
  };

  const handleSlotConfirm = () => {
    if (!selectedDoctorId) {
      toast.add({ title: 'Please select a doctor', type: 'error' });
      return;
    }
    if (!selectedSlot || !selectedDate) {
      toast.add({ title: 'Please select a time slot', type: 'error' });
      return;
    }
    setStep('patient-form');
  };

  const handleBookSlot = async (data: BookSlotForm) => {
    if (!selectedSlot || !selectedDate || !selectedDoctorId) return;

    try {
      await bookSlotMutation.mutateAsync({
        doctor_id: selectedDoctorId,
        date: selectedDate,
        start_time: formatTimeShort(selectedSlot.start_time),
        name: data.name.trim(),
        mobile_number: data.mobile.trim(),
        gender: data.gender,
        source: data.source || 'PHONE',
      });

      toast.add({ title: 'Appointment booked successfully!', type: 'success' });
      resetAll();
      props.close();
    } catch (error: any) {
      // Handle 409 CONFLICT specifically
      if (error?.statusCode === 409 || error?.code === 'CONFLICT') {
        toast.add({
          title:
            'This slot was just booked by someone else. Please select another.',
          type: 'error',
        });
        setSelectedSlot(null);
        setStep('slot-picker');
        return;
      }

      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        Object.entries(validationErrors).forEach(([field, message]) => {
          if (field in patientForm.getValues()) {
            patientForm.setError(field as keyof BookSlotForm, {
              type: 'manual',
              message: message as string,
            });
          }
        });
      }
      toast.add({ title: getErrorMessage(error), type: 'error' });
    }
  };

  const resetAll = () => {
    mobileForm.reset();
    patientForm.reset();
    setStep('mobile');
    setFoundPatient(null);
    setSelectedDoctorId(doctors.length === 1 ? doctors[0].id : '');
    setSelectedDate('');
    setSelectedSlot(null);
  };

  const handleBack = () => {
    if (step === 'patient-form') {
      setStep('slot-picker');
    } else if (step === 'slot-picker') {
      setStep('mobile');
      setSelectedDate('');
      setSelectedSlot(null);
    }
  };

  const handleCancel = () => {
    resetAll();
    props.close();
  };

  const selectedDoctorName = doctors.find(
    (d) => d.id === selectedDoctorId,
  )?.name;

  const stepTitle = {
    mobile: 'Create Appointment',
    'slot-picker': 'Select Time Slot',
    'patient-form': 'Confirm Booking',
  }[step];

  const renderSlotButtons = (slots: AvailableSlot[], label: string) => {
    if (slots.length === 0) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
        <div className="flex flex-wrap gap-2">
          {slots.map((slot) => {
            const isSelected =
              selectedSlot?.start_time === slot.start_time &&
              selectedSlot?.end_time === slot.end_time;
            return (
              <button
                key={slot.start_time}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-teal-400 hover:text-teal-700'
                }`}
              >
                {formatTimeShort(slot.start_time)}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Dialog.Root open={props.isOpen} onOpenChange={handleCancel}>
      <Dialog.Popup className={step === 'slot-picker' ? 'max-w-2xl' : ''}>
        <Dialog.Header>
          <Dialog.Title>{stepTitle}</Dialog.Title>
        </Dialog.Header>
        <Dialog.Panel>
          {/* Step 1: Mobile Search */}
          {step === 'mobile' && (
            <Form onSubmit={mobileForm.handleSubmit(handleSearchPatient)}>
              <Fieldset.Root>
                <Field.Root name="mobile">
                  <Field.Label htmlFor="mobile">Mobile Number *</Field.Label>
                  <Field.Item block>
                    <Field.Control
                      id="mobile"
                      render={
                        <Input
                          id="mobile"
                          type="tel"
                          placeholder="Enter mobile number (e.g., +91 9876543210)"
                          autoFocus
                          disabled={searching}
                          {...mobileForm.register('mobile', {
                            onChange: (e) => {
                              mobileForm.setValue(
                                'mobile',
                                formatPhoneInput(e.target.value),
                              );
                            },
                          })}
                        />
                      }
                    />
                  </Field.Item>
                  {mobileForm.formState.errors.mobile && (
                    <Field.Error>
                      {mobileForm.formState.errors.mobile.message}
                    </Field.Error>
                  )}
                  <Field.Description>
                    Enter the patient's mobile number to search. If the patient
                    exists, we'll use their information.
                  </Field.Description>
                </Field.Root>
              </Fieldset.Root>
            </Form>
          )}

          {/* Step 2: Slot Picker */}
          {step === 'slot-picker' && (
            <div className="space-y-4">
              {/* Doctor Selector */}
              {doctors.length > 1 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Select Doctor *
                  </label>
                  <Select.Root
                    value={selectedDoctorId || undefined}
                    onValueChange={(value) => {
                      setSelectedDoctorId(value ?? '');
                      setSelectedDate('');
                      setSelectedSlot(null);
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value placeholder="Select doctor" />
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

              {selectedDoctorId && (
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Date Selection */}
                  <div className="md:w-1/2">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Select Date
                    </p>
                    {slotsLoading ? (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        Loading available dates...
                      </div>
                    ) : (
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                          const hasSlots = availableDates.has(day.date);
                          const isSelected = selectedDate === day.date;
                          const isToday =
                            day.date === dayjs().format('YYYY-MM-DD');
                          return (
                            <button
                              key={day.date}
                              type="button"
                              disabled={!hasSlots}
                              onClick={() => {
                                setSelectedDate(day.date);
                                setSelectedSlot(null);
                              }}
                              className={`flex flex-col items-center p-1.5 rounded-lg text-xs transition-colors ${
                                isSelected
                                  ? 'bg-teal-600 text-white'
                                  : hasSlots
                                    ? 'bg-white border border-gray-200 hover:border-teal-400 text-gray-800 font-medium'
                                    : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                              } ${isToday && !isSelected ? 'ring-1 ring-teal-400' : ''}`}
                            >
                              <span className="text-[10px]">{day.dayName}</span>
                              <span className="text-sm font-semibold">
                                {day.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Time Slots */}
                  <div className="md:w-1/2">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {selectedDate
                        ? `Available Times - ${dayjs(selectedDate).format('ddd, DD MMM')}`
                        : 'Select a date to see times'}
                    </p>
                    {selectedDate && slotsForDate ? (
                      <div className="max-h-64 overflow-y-auto pr-1">
                        {renderSlotButtons(slotsForDate.morning, 'Morning')}
                        {renderSlotButtons(slotsForDate.afternoon, 'Afternoon')}
                        {renderSlotButtons(slotsForDate.evening, 'Evening')}
                      </div>
                    ) : selectedDate ? (
                      <div className="text-sm text-gray-500 py-4 text-center">
                        No slots available for this date
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 py-4 text-center">
                        Pick a highlighted date
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected slot summary */}
              {selectedSlot && selectedDate && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800 font-medium">
                    {selectedDoctorName} |{' '}
                    {dayjs(selectedDate).format('ddd, DD MMM YYYY')}
                  </p>
                  <p className="text-sm text-teal-700">
                    {formatTimeShort(selectedSlot.start_time)} -{' '}
                    {formatTimeShort(selectedSlot.end_time)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Patient Form */}
          {step === 'patient-form' && (
            <Form onSubmit={patientForm.handleSubmit(handleBookSlot)}>
              <Fieldset.Root>
                {/* Slot summary */}
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <p className="text-sm text-teal-800 font-medium">
                    {selectedDoctorName} |{' '}
                    {dayjs(selectedDate).format('ddd, DD MMM YYYY')}
                  </p>
                  <p className="text-sm text-teal-700">
                    {selectedSlot &&
                      `${formatTimeShort(selectedSlot.start_time)} - ${formatTimeShort(selectedSlot.end_time)}`}
                  </p>
                </div>

                {foundPatient && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm text-teal-800 font-medium">
                      Patient found in database
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      {foundPatient.name} | {foundPatient.mobile}
                    </p>
                  </div>
                )}

                <Field.Root name="name">
                  <Field.Label htmlFor="patientName">Name *</Field.Label>
                  <Field.Item block>
                    <Field.Control
                      id="patientName"
                      render={
                        <Input
                          id="patientName"
                          placeholder="Enter patient name"
                          disabled={!!foundPatient}
                          autoFocus={!foundPatient}
                          {...patientForm.register('name')}
                        />
                      }
                    />
                  </Field.Item>
                  {patientForm.formState.errors.name && (
                    <Field.Error>
                      {patientForm.formState.errors.name.message}
                    </Field.Error>
                  )}
                </Field.Root>

                <Field.Root name="mobile">
                  <Field.Label htmlFor="patientMobile">Mobile *</Field.Label>
                  <Field.Item block>
                    <Field.Control
                      id="patientMobile"
                      render={
                        <Input
                          id="patientMobile"
                          type="tel"
                          placeholder="Enter mobile number"
                          disabled={!!foundPatient}
                          {...patientForm.register('mobile', {
                            onChange: (e) => {
                              patientForm.setValue(
                                'mobile',
                                formatPhoneInput(e.target.value),
                              );
                            },
                          })}
                        />
                      }
                    />
                  </Field.Item>
                  {patientForm.formState.errors.mobile && (
                    <Field.Error>
                      {patientForm.formState.errors.mobile.message}
                    </Field.Error>
                  )}
                </Field.Root>

                <Field.Root name="gender">
                  <Field.Label>Gender *</Field.Label>
                  <RadioGroup.Root
                    value={patientForm.watch('gender')}
                    onValueChange={(value) =>
                      patientForm.setValue(
                        'gender',
                        value as 'MALE' | 'FEMALE' | 'OTHER',
                      )
                    }
                    disabled={!!foundPatient}
                    className="flex-row gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroup.Item value="MALE" />
                      <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroup.Item value="FEMALE" />
                      <span className="text-sm">Female</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroup.Item value="OTHER" />
                      <span className="text-sm">Other</span>
                    </label>
                  </RadioGroup.Root>
                  {patientForm.formState.errors.gender && (
                    <Field.Error>
                      {patientForm.formState.errors.gender.message}
                    </Field.Error>
                  )}
                </Field.Root>

                <Field.Root name="source">
                  <Field.Label>Source</Field.Label>
                  <Field.Item block>
                    <Select.Root
                      value={patientForm.watch('source') || 'PHONE'}
                      onValueChange={(value) => {
                        if (value) {
                          patientForm.setValue(
                            'source',
                            value as BookSlotForm['source'],
                          );
                        }
                      }}
                    >
                      <Select.Trigger className="w-full">
                        <Select.Value placeholder="Select source" />
                      </Select.Trigger>
                      <Select.Popup>
                        <Select.Item value="PHONE">Phone</Select.Item>
                        <Select.Item value="WHATSAPP">WhatsApp</Select.Item>
                        <Select.Item value="WALK_IN">Walk In</Select.Item>
                        <Select.Item value="WEBSITE">Website</Select.Item>
                        <Select.Item value="OTHER">Other</Select.Item>
                      </Select.Popup>
                    </Select.Root>
                  </Field.Item>
                </Field.Root>
              </Fieldset.Root>
            </Form>
          )}
        </Dialog.Panel>
        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={step === 'mobile' ? handleCancel : handleBack}
          >
            {step === 'mobile' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={
              step === 'mobile'
                ? mobileForm.handleSubmit(handleSearchPatient)
                : step === 'slot-picker'
                  ? handleSlotConfirm
                  : patientForm.handleSubmit(handleBookSlot)
            }
            disabled={
              searching ||
              bookSlotMutation.isPending ||
              (step === 'slot-picker' && (!selectedSlot || !selectedDate))
            }
            loading={searching || bookSlotMutation.isPending}
          >
            <>
              {step === 'mobile'
                ? 'Search'
                : step === 'slot-picker'
                  ? 'Continue'
                  : 'Confirm Booking'}
            </>
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
