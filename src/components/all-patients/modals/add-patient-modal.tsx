import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup } from '@/components/ui/radio-group';
import { formatPhoneInput } from '@/utils/phone-validation';

export interface AddPatientFormValue {
  name: string;
  mobile: string;
  age: string;
  gender: 'M' | 'F' | '';
}

interface AddPatientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: AddPatientFormValue;
  errors: Record<string, string>;
  onPatientChange: (patient: AddPatientFormValue) => void;
  onSave: () => void;
  isCreating: boolean;
}

export default function AddPatientModal({
  open,
  onOpenChange,
  patient,
  errors,
  onPatientChange,
  onSave,
  isCreating,
}: AddPatientModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>Add New Patient</Dialog.Title>
        </Dialog.Header>
        <Dialog.Panel>
          <div className="space-y-5">
            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="all-patients-name">Name *</Label>
              <Input
                id="all-patients-name"
                value={patient.name}
                onChange={(e) =>
                  onPatientChange({ ...patient, name: e.target.value })
                }
                placeholder="Enter patient name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave();
                  }
                }}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="all-patients-mobile">Mobile *</Label>
              <Input
                id="all-patients-mobile"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                pattern="^[+0-9\\s()-]{8,20}$"
                value={patient.mobile}
                onChange={(e) =>
                  onPatientChange({
                    ...patient,
                    mobile: formatPhoneInput(e.target.value),
                  })
                }
                placeholder="Enter mobile number (e.g., +91 9876543210)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave();
                  }
                }}
              />
              {errors.mobile && (
                <p className="text-sm text-red-500">{errors.mobile}</p>
              )}
            </div>

            <div className="flex flex-col items-start gap-2">
              <Label htmlFor="all-patients-age">Age</Label>
              <Input
                id="all-patients-age"
                type="number"
                value={patient.age}
                onChange={(e) =>
                  onPatientChange({ ...patient, age: e.target.value })
                }
                placeholder="Enter age (optional)"
                min="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onSave();
                  }
                }}
              />
              {errors.age && (
                <p className="text-sm text-red-500">{errors.age}</p>
              )}
            </div>

            <div>
              <Label>Gender *</Label>
              <RadioGroup.Root
                value={patient.gender}
                onValueChange={(value) =>
                  onPatientChange({ ...patient, gender: value as 'M' | 'F' })
                }
                className="mt-2 flex-row gap-4"
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
                <p className="mt-1 text-sm text-red-500">{errors.gender}</p>
              )}
            </div>
          </div>
        </Dialog.Panel>

        <Dialog.Footer>
          <Dialog.Close
            render={<Button disabled={isCreating} variant="outline" />}
          >
            Cancel
          </Dialog.Close>
          <Button disabled={isCreating} loading={isCreating} onClick={onSave}>
            Save Patient
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
