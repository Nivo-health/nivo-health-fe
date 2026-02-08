import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { ModalControl } from '@/hooks/useModal';
import { useCreateAppointment } from '@/queries/appointments.queries';
import { useCurrentClinic } from '@/queries/clinic.queries';
import { usePatientSearchLazy } from '@/queries/patients.queries';
import { createAppointmentSchema } from '@/schema/create-appointment-schema';
import { mobileSearchSchema } from '@/schema/mobile-search-schema';
import type { Patient } from '@/types';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '@/utils/errorHandler';
import { formatPhoneInput } from '@/utils/phoneValidation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { RadioGroup } from '../ui/radio-group';

type CreateAppointmentDialogProps = ModalControl;
type MobileSearchForm = z.infer<typeof mobileSearchSchema>;
type CreateAppointmentForm = z.infer<typeof createAppointmentSchema>;

export default function CreateAppointmentDialog(
  props: CreateAppointmentDialogProps,
) {
  const { data: clinic } = useCurrentClinic();
  const doctors = clinic?.doctors || [];
  const createAppointmentMutation = useCreateAppointment();
  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const patientSearchLazy = usePatientSearchLazy();

  const searching = patientSearchLazy.isPending;
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);

  const mobileForm = useForm<MobileSearchForm>({
    resolver: zodResolver(mobileSearchSchema),
    defaultValues: {
      mobile: '',
    },
  });

  const appointmentForm = useForm<CreateAppointmentForm>({
    resolver: zodResolver(
      createAppointmentSchema.refine(
        (data) => {
          if (doctors.length > 1) {
            return !!data.doctorId;
          }
          return true;
        },
        {
          message: 'Please select a doctor',
          path: ['doctorId'],
        },
      ),
    ),
    defaultValues: {
      name: '',
      mobile: '',
      gender: undefined,
      doctorId: doctors.length === 1 ? doctors[0].id : undefined,
      appointmentDateTime: '',
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

        appointmentForm.reset({
          name: patient.name || '',
          mobile: patient.mobile || data.mobile,
          gender: patient.gender || undefined,
          doctorId: doctors.length === 1 ? doctors[0].id : undefined,
          appointmentDateTime: '',
        });
        setStep('patient-form');
      } else {
        setFoundPatient(null);
        appointmentForm.reset({
          name: '',
          mobile: data.mobile,
          gender: undefined,
          doctorId: doctors.length === 1 ? doctors[0].id : undefined,
          appointmentDateTime: '',
        });
        setStep('patient-form');
      }
    } catch (error) {
      toast.add({
        title: 'Failed to search patient',
        type: 'error',
      });
    }
  };

  const handleCreateAppointment = async (data: CreateAppointmentForm) => {
    try {
      const gender = data.gender === 'M' ? 'MALE' : 'FEMALE';
      const doctorId =
        data.doctorId || (doctors.length === 1 ? doctors[0].id : '');

      if (!doctorId) {
        toast.add({
          title: 'Please select a doctor',
          type: 'error',
        });
        return;
      }

      const isoDateTime = data.appointmentDateTime
        ? new Date(data.appointmentDateTime).toISOString()
        : '';

      if (!isoDateTime) {
        toast.add({
          title: 'Invalid appointment date/time',
          type: 'error',
        });
        return;
      }

      await createAppointmentMutation.mutateAsync({
        name: data.name.trim(),
        mobile_number: data.mobile.trim(),
        gender: gender,
        doctor_id: doctorId,
        appointment_date_time: isoDateTime,
        appointment_status: 'WAITING',
        source: 'PHONE',
      });

      toast.add({
        title: 'Appointment created successfully!',
        type: 'success',
      });

      mobileForm.reset();
      appointmentForm.reset();
      setStep('mobile');
      setFoundPatient(null);
      props.close();
    } catch (error: any) {
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);

        Object.entries(validationErrors).forEach(([field, message]) => {
          if (field in appointmentForm.getValues()) {
            appointmentForm.setError(field as keyof CreateAppointmentForm, {
              type: 'manual',
              message: message as string,
            });
          }
        });

        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      } else {
        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      }
    }
  };

  const handleBack = () => {
    setStep('mobile');
    appointmentForm.reset();
    setFoundPatient(null);
  };

  const handleCancel = () => {
    mobileForm.reset();
    appointmentForm.reset();
    setStep('mobile');
    setFoundPatient(null);
    props.close();
  };

  return (
    <Dialog.Root open={props.isOpen} onOpenChange={handleCancel}>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>
            {step === 'mobile' ? 'Create Appointment' : 'Create Appointment'}
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Panel>
          {step === 'mobile' ? (
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
                    exists, we'll use their information. Otherwise, you'll be
                    asked to enter their details.
                  </Field.Description>
                </Field.Root>
              </Fieldset.Root>
            </Form>
          ) : (
            <Form
              onSubmit={appointmentForm.handleSubmit(handleCreateAppointment)}
            >
              <Fieldset.Root>
                {foundPatient && (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg">
                    <p className="text-sm text-teal-800 font-medium">
                      ✓ Patient found in database
                    </p>
                    <p className="text-xs text-teal-600 mt-1">
                      {foundPatient.name} • {foundPatient.mobile}
                    </p>
                  </div>
                )}

                <Field.Root name="name">
                  <Field.Label htmlFor="name">Name *</Field.Label>

                  <Field.Item block>
                    <Field.Control
                      id="name"
                      render={
                        <Input
                          id="name"
                          placeholder="Enter patient name"
                          disabled={!!foundPatient}
                          autoFocus={!foundPatient}
                          {...appointmentForm.register('name')}
                        />
                      }
                    />
                  </Field.Item>

                  {appointmentForm.formState.errors.name && (
                    <Field.Error>
                      {appointmentForm.formState.errors.name.message}
                    </Field.Error>
                  )}
                </Field.Root>

                <Field.Root name="mobile">
                  <Field.Label htmlFor="mobile">Mobile *</Field.Label>

                  <Field.Item block>
                    <Field.Control
                      id="mobile"
                      render={
                        <Input
                          id="mobile"
                          type="tel"
                          placeholder="Enter mobile number (e.g., +91 9876543210)"
                          disabled={!!foundPatient}
                          {...appointmentForm.register('mobile', {
                            onChange: (e) => {
                              appointmentForm.setValue(
                                'mobile',
                                formatPhoneInput(e.target.value),
                              );
                            },
                          })}
                        />
                      }
                    />
                  </Field.Item>

                  {appointmentForm.formState.errors.mobile && (
                    <Field.Error>
                      {appointmentForm.formState.errors.mobile.message}
                    </Field.Error>
                  )}
                </Field.Root>

                <Field.Root name="gender">
                  <Field.Label>Gender *</Field.Label>

                  <RadioGroup.Root
                    value={appointmentForm.watch('gender')}
                    onValueChange={(value) =>
                      appointmentForm.setValue('gender', value as 'M' | 'F')
                    }
                    disabled={!!foundPatient}
                    className="flex-row gap-4"
                  >
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroup.Item value="M" />
                      <span className="text-sm">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <RadioGroup.Item value="F" />
                      <span className="text-sm">Female</span>
                    </label>
                  </RadioGroup.Root>

                  {appointmentForm.formState.errors.gender && (
                    <Field.Error>
                      {appointmentForm.formState.errors.gender.message}
                    </Field.Error>
                  )}

                  {appointmentForm.formState.errors.gender && (
                    <Field.Error>
                      {appointmentForm.formState.errors.gender.message}
                    </Field.Error>
                  )}
                </Field.Root>

                {doctors.length > 1 && (
                  <Field.Root name="doctorId">
                    <Field.Label>Select Doctor *</Field.Label>

                    <Field.Item block>
                      <Select.Root
                        value={appointmentForm.watch('doctorId')}
                        onValueChange={(value) => {
                          if (value) {
                            appointmentForm.setValue('doctorId', value);
                          }
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
                    </Field.Item>

                    {appointmentForm.formState.errors.doctorId && (
                      <Field.Error>
                        {appointmentForm.formState.errors.doctorId.message}
                      </Field.Error>
                    )}
                  </Field.Root>
                )}

                <Field.Root name="appointmentDateTime">
                  <Field.Label htmlFor="appointmentDateTime">
                    Appointment Date & Time *
                  </Field.Label>

                  <Field.Item block>
                    <Field.Control
                      id="appointmentDateTime"
                      render={
                        <input
                          id="appointmentDateTime"
                          type="datetime-local"
                          className={`flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            appointmentForm.formState.errors.appointmentDateTime
                              ? 'border-red-500 focus-visible:ring-red-500'
                              : 'border-teal-300 focus-visible:ring-teal-500'
                          }`}
                          min={new Date().toISOString().slice(0, 16)}
                          {...appointmentForm.register('appointmentDateTime')}
                        />
                      }
                    />
                  </Field.Item>

                  {appointmentForm.formState.errors.appointmentDateTime && (
                    <Field.Error>
                      {
                        appointmentForm.formState.errors.appointmentDateTime
                          .message
                      }
                    </Field.Error>
                  )}
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
                : appointmentForm.handleSubmit(handleCreateAppointment)
            }
            disabled={searching}
            loading={searching}
          >
            <>{step === 'mobile' ? 'Search' : 'Create Appointment'}</>
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
