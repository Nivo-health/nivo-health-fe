import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { FollowUp, Medicine } from '@/types';

interface SendWhatsappModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medicines: Medicine[];
  followUp: FollowUp | null;
  onSend: () => void;
}

export default function SendWhatsappModal({
  open,
  onOpenChange,
  medicines,
  followUp,
  onSend,
}: SendWhatsappModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Popup>
        <Dialog.Header>
          <Dialog.Title>Send Prescription on WhatsApp</Dialog.Title>
        </Dialog.Header>
        <Dialog.Panel>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Preview of prescription to be sent:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {medicines.length > 0 ? (
                <div className="space-y-3">
                  {medicines.map((medicine, index) => (
                    <div key={index} className="border-b border-gray-200 pb-2">
                      <div className="font-medium">{medicine.name}</div>
                      <div className="text-sm text-gray-600">
                        {medicine.dosage} - {medicine.duration}
                        {medicine.notes && ` (${medicine.notes})`}
                      </div>
                    </div>
                  ))}
                  {followUp && (
                    <div className="mt-3 pt-2 border-t border-gray-300">
                      <strong>Follow-up:</strong> After {followUp.value}{' '}
                      {followUp.unit}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No medicines added</p>
              )}
            </div>
          </div>
        </Dialog.Panel>
        <Dialog.Footer>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSend}>Send</Button>
        </Dialog.Footer>
      </Dialog.Popup>
    </Dialog.Root>
  );
}
