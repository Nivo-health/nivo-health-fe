import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Stepper } from '../components/ui/Stepper';
import { visitService } from '../services/visitService';
import { getVisitStep, visitSteps } from '../utils/visitStepper';

export default function ConsultationScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [visit, setVisit] = useState<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const loadVisit = async () => {
      if (!visitId) {
        navigate('/visits');
        return;
      }

      const visitData = await visitService.getById(visitId);
      if (!visitData) {
        navigate('/visits');
        return;
      }

      setVisit(visitData);
      setNotes(visitData.notes || '');
      textareaRef.current?.focus();
    };

    loadVisit();
  }, [visitId, navigate]);

  const saveNotes = async () => {
    if (!visitId) return;
    setIsSaving(true);
    await visitService.updateNotes(visitId, notes);
    // Reload visit to update stepper
    const updatedVisit = await visitService.getById(visitId);
    if (updatedVisit) {
      setVisit(updatedVisit);
    }
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = window.setTimeout(() => {
      saveNotes();
    }, 500);
  };

  const handleBlur = () => {
    saveNotes();
  };

  const handleProceed = async () => {
    // Save notes (even if empty) to mark the step as complete
    if (!visitId) return;
    setIsSaving(true);
    await visitService.updateNotes(visitId, notes || '');
    // Reload visit to update stepper
    const updatedVisit = await visitService.getById(visitId);
    if (updatedVisit) {
      setVisit(updatedVisit);
    }
    setIsSaving(false);
    navigate(`/prescription/${visitId}`);
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
        <Card className="mb-4 border-teal-200">
          <CardContent className="pt-4 pb-4">
            <Stepper steps={visitSteps} currentStep={getVisitStep(visit, 'consultation')} />
          </CardContent>
        </Card>

        <Card className="border-teal-200">
          <CardHeader>
            <CardTitle>Consultation Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter consultation notes (optional)
                </label>
                <textarea
                  ref={textareaRef}
                  id="notes"
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  onBlur={handleBlur}
                  placeholder="Enter patient symptoms, diagnosis, observations, etc..."
                  className="w-full min-h-[400px] px-3 py-2 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                  autoFocus
                />
                {isSaving && (
                  <p className="mt-2 text-xs text-gray-500">Saving...</p>
                )}
              </div>
              <div className="flex justify-end">
                <Button onClick={handleProceed} size="lg">
                  Proceed to Prescription
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
