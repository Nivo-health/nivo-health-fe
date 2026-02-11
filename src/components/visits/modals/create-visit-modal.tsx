import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import type { Patient } from '@/types';
import { formatPhoneInput } from '@/utils/phone-validation';

type Step = 'mobile' | 'patient-form';

interface NewPatientForm {
  name: string;
  mobile: string;
  age: string;
  gender: 'M' | 'F' | '';
}

interface DoctorOption {
  id: string;
  name: string;
}

interface CreateVisitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: Step;
  onStepChange: (step: Step) => void;
  mobileNumber: string;
  onMobileNumberChange: (value: string) => void;
  foundPatient: Patient | null;
  newPatient: NewPatientForm;
  onNewPatientChange: (value: NewPatientForm) => void;
  visitReason: string;
  onVisitReasonChange: (value: string) => void;
  clinicDoctors: DoctorOption[];
  selectedDoctorId: string;
  onSelectedDoctorIdChange: (value: string) => void;
  doctorError: string;
  errors: Record<string, string>;
  onErrorsChange: (errors: Record<string, string>) => void;
  onSearchPatient: () => void;
  onCreateVisit: () => void;
  searching: boolean;
}

export default function CreateVisitModal({
  open,
  onOpenChange,
  step,
  onStepChange,
  mobileNumber,
  onMobileNumberChange,
  foundPatient,
  newPatient,
  onNewPatientChange,
  visitReason,
  onVisitReasonChange,
  clinicDoctors,
  selectedDoctorId,
  onSelectedDoctorIdChange,
  doctorError,
  errors,
  onErrorsChange,
  onSearchPatient,
  onCreateVisit,
  searching,
}: CreateVisitModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>
            {step === 'mobile' ? 'Search Patient' : 'Create Visit'}
          </Dialog.Title>
        </Dialog.Header>

        <Dialog.Panel>
          {step === 'mobile' ? (
            <div className="space-y-5">
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="visit-mobile">Mobile *</Label>
                <Input
                  id="visit-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^[+0-9\\s()-]{8,20}$"
                  value={mobileNumber}
                  placeholder="Enter mobile number (e.g., +91 9876543210)"
                  autoFocus
                  onChange={(e) => {
                    onMobileNumberChange(formatPhoneInput(e.target.value));
                    onErrorsChange({});
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mobileNumber.trim()) {
                      onSearchPatient();
                    }
                  }}
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile}</p>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                Enter the patient's mobile number to search. If the patient
                exists, we will use their information. Otherwise, you will be
                asked to enter their details.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {foundPatient && (
                <div className="rounded-md border p-3 text-sm text-green-600">
                  Patient found in database
                  <div className="font-medium">
                    {foundPatient.name} • {foundPatient.mobile}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="visit-name">Name *</Label>
                <Input
                  id="visit-name"
                  value={newPatient.name}
                  placeholder="Enter patient name"
                  disabled={!!foundPatient}
                  autoFocus={!foundPatient}
                  onChange={(e) =>
                    onNewPatientChange({ ...newPatient, name: e.target.value })
                  }
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="visit-patient-mobile">Mobile *</Label>
                <Input
                  id="visit-patient-mobile"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  pattern="^[+0-9\\s()-]{8,20}$"
                  value={newPatient.mobile}
                  placeholder="Enter mobile number (e.g., +91 9876543210)"
                  disabled={!!foundPatient}
                  onChange={(e) =>
                    onNewPatientChange({
                      ...newPatient,
                      mobile: formatPhoneInput(e.target.value),
                    })
                  }
                />
                {errors.mobile && (
                  <p className="text-sm text-red-500">{errors.mobile}</p>
                )}
              </div>

              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="visit-age">Age</Label>
                <Input
                  id="visit-age"
                  type="number"
                  min="0"
                  value={newPatient.age}
                  placeholder="Enter age (optional)"
                  onChange={(e) =>
                    onNewPatientChange({ ...newPatient, age: e.target.value })
                  }
                />
                {errors.age && (
                  <p className="text-sm text-red-500">{errors.age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Gender *</Label>
                <RadioGroup.Root
                  value={newPatient.gender}
                  onValueChange={(value) =>
                    onNewPatientChange({
                      ...newPatient,
                      gender: value as 'M' | 'F',
                    })
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
                {errors.gender && (
                  <p className="text-sm text-red-500">{errors.gender}</p>
                )}
              </div>

              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="visit-reason">Visit Reason</Label>
                <Input
                  id="visit-reason"
                  value={visitReason}
                  placeholder="e.g., General consultation, Follow-up"
                  onChange={(e) => onVisitReasonChange(e.target.value)}
                />
              </div>

              {clinicDoctors.length > 1 && (
                <div className="flex flex-col items-start gap-2">
                  <Label>Select Doctor *</Label>
                  <Select.Root
                    value={selectedDoctorId}
                    onValueChange={(value) => {
                      if (value) {
                        onSelectedDoctorIdChange(value);
                      }
                    }}
                  >
                    <Select.Trigger className="w-full">
                      <Select.Value placeholder="Select doctor" />
                    </Select.Trigger>
                    <Select.Popup>
                      {clinicDoctors.map((doctor) => (
                        <Select.Item key={doctor.id} value={doctor.id}>
                          {doctor.name}
                        </Select.Item>
                      ))}
                    </Select.Popup>
                  </Select.Root>

                  {doctorError && (
                    <p className="text-sm text-red-500">{doctorError}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </Dialog.Panel>

        <Dialog.Footer>
          <Button
            variant="outline"
            onClick={() => {
              if (step === 'patient-form') {
                onStepChange('mobile');
                onErrorsChange({});
              } else {
                onOpenChange(false);
              }
            }}
          >
            {step === 'mobile' ? 'Cancel' : 'Back'}
          </Button>

          <Button
            onClick={() => {
              step === 'mobile' ? onSearchPatient() : onCreateVisit();
            }}
            disabled={searching}
          >
            {searching
              ? 'Searching...'
              : step === 'mobile'
                ? 'Search'
                : 'Create Visit'}
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
