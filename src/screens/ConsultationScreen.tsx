import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { visitService } from '../services/visitService';

export default function ConsultationScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const loadVisit = async () => {
      if (!visitId) {
        navigate('/patient-search');
        return;
      }

      const visit = await visitService.getById(visitId);
      if (!visit) {
        navigate('/patient-search');
        return;
      }

      setNotes(visit.notes || '');
      textareaRef.current?.focus();
    };

    loadVisit();
  }, [visitId, navigate]);

  const saveNotes = async () => {
    if (!visitId) return;
    setIsSaving(true);
    await visitService.updateNotes(visitId, notes);
    setTimeout(() => setIsSaving(false), 300);
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      saveNotes();
    }, 500);
  };

  const handleBlur = () => {
    saveNotes();
  };

  const handleProceed = () => {
    saveNotes();
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
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-6">
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
