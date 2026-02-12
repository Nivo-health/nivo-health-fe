import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Stepper } from '../components/ui/stepper';
import { useVisit } from '../queries/visits.queries';
import { usePrescription } from '../queries/prescriptions.queries';
import { getVisitStep, visitSteps } from '../utils/visit-stepper';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function ConsultationScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const { data: visit } = useVisit(visitId || '');
  const { data: prescription } = usePrescription(visit?.prescription_id || '');

  useEffect(() => {
    if (!visitId) {
      navigate('/visits');
      return;
    }
    if (!visit) return;
    if (visit.prescription_id && prescription?.notes) {
      setNotes(prescription.notes);
    } else {
      setNotes(visit.notes || '');
    }
    textareaRef.current?.focus();
  }, [visitId, visit, prescription, navigate]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
  };

  const handleBlur = () => {
    // No-op for now; notes are saved when creating/updating prescription
  };

  const handleProceed = async () => {
    if (!visitId) return;
    // Pass notes to PrescriptionScreen via navigation state
    navigate(`/prescription/${visitId}`, { state: { notes } });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Visit Progress Stepper */}
        <Card.Root className="mb-4 border-teal-200">
          <Card.Panel className="pt-4 pb-4">
            <Stepper
              steps={visitSteps}
              currentStep={getVisitStep(visit, 'consultation')}
            />
          </Card.Panel>
        </Card.Root>

        <Card.Root className="border-teal-200">
          <Card.Header>
            <Card.Title>Consultation Notes</Card.Title>
          </Card.Header>
          <Card.Panel>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Enter consultation notes (optional)
                </label>
                <Textarea
                  ref={textareaRef}
                  id="notes"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter patient symptoms, diagnosis, observations, etc..."
                  className="min-h-100"
                  autoFocus
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProceed} size="lg">
                  Proceed to Prescription
                </Button>
              </div>
            </div>
          </Card.Panel>
        </Card.Root>
      </div>
    </div>
  );
}
