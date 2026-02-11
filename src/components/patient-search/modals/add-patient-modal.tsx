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
}

export default function AddPatientModal({
  open,
  onOpenChange,
  patient,
  errors,
  onPatientChange,
  onSave,
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
              <Label htmlFor="patient-search-name">Name *</Label>
              <Input
                id="patient-search-name"
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
              <Label htmlFor="patient-search-mobile">Mobile *</Label>
              <Input
                id="patient-search-mobile"
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
              <Label htmlFor="patient-search-age">Age</Label>
              <Input
                id="patient-search-age"
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
              <Label>Gender (optional)</Label>
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
            </div>
          </div>
        </Dialog.Panel>
        <Dialog.Footer>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save Patient</Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
