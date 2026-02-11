import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Fieldset } from '@/components/ui/fieldset';
import { Form } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

export interface WorkingHourFormValue {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

interface WorkingHourModalProps {
  open: boolean;
  editing: boolean;
  dayLabels: string[];
  value: WorkingHourFormValue;
  onChange: (value: WorkingHourFormValue) => void;
  onClose: () => void;
  onSave: () => void;
  isSaving: boolean;
}

export default function WorkingHourModal({
  open,
  editing,
  dayLabels,
  value,
  onChange,
  onClose,
  onSave,
  isSaving,
}: WorkingHourModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>
            {editing ? 'Edit Working Hour' : 'Add Working Hour'}
          </Dialog.Title>
        </Dialog.Header>
        <Dialog.Panel>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              onSave();
            }}
          >
            <Fieldset.Root>
              {!editing && (
                <Field.Root name="dayOfWeek">
                  <Field.Label>Day</Field.Label>
                  <Field.Item block>
                    <Input value={dayLabels[value.dayOfWeek]} disabled />
                  </Field.Item>
                </Field.Root>
              )}

              <Field.Root name="startTime">
                <Field.Label htmlFor="working-hour-start">
                  Start Time *
                </Field.Label>
                <Field.Item block>
                  <Field.Control
                    id="working-hour-start"
                    render={
                      <Input
                        id="working-hour-start"
                        type="time"
                        value={value.startTime}
                        onChange={(e) =>
                          onChange({ ...value, startTime: e.target.value })
                        }
                      />
                    }
                  />
                </Field.Item>
              </Field.Root>

              <Field.Root name="endTime">
                <Field.Label htmlFor="working-hour-end">End Time *</Field.Label>
                <Field.Item block>
                  <Field.Control
                    id="working-hour-end"
                    render={
                      <Input
                        id="working-hour-end"
                        type="time"
                        value={value.endTime}
                        onChange={(e) =>
                          onChange({ ...value, endTime: e.target.value })
                        }
                      />
                    }
                  />
                </Field.Item>
              </Field.Root>

              <Field.Root name="slotDuration">
                <Field.Label htmlFor="working-hour-duration">
                  Slot Duration (minutes)
                </Field.Label>
                <Field.Item block>
                  <Field.Control
                    id="working-hour-duration"
                    render={
                      <Input
                        id="working-hour-duration"
                        type="number"
                        min={5}
                        max={120}
                        value={value.slotDuration}
                        onChange={(e) =>
                          onChange({
                            ...value,
                            slotDuration: parseInt(e.target.value, 10) || 15,
                          })
                        }
                      />
                    }
                  />
                </Field.Item>
              </Field.Root>
            </Fieldset.Root>
          </Form>
        </Dialog.Panel>
        <Dialog.Footer>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSave} loading={isSaving} disabled={isSaving}>
            {editing ? 'Update' : 'Add'}
          </Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
