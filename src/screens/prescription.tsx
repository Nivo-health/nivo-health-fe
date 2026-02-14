import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Stepper } from '../components/ui/stepper';
import { getVisitStep, visitSteps } from '../utils/visit-stepper';
import type { Medicine, Prescription, FollowUp } from '../types';
import { useVisit, useUpdateVisitStatus } from '../queries/visits.queries';
import {
  usePrescription,
  useSavePrescription,
} from '../queries/prescriptions.queries';
import { useSendPrescription } from '../queries/whatsapp.queries';
import { usePatient } from '../queries/patients.queries';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/error-handler';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MedicationInput } from '@/components/ui/medication-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotesInput } from '@/components/ui/notes-input';
import { Table } from '@/components/ui/table';
import SendWhatsappModal from '@/components/prescription/modals/send-whatsapp-modal';
import { toast } from '@/components/ui/toast';
import { RadioGroup } from '@/components/ui/radio-group';
import { Select } from '@/components/ui/select';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';

export default function PrescriptionScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationState = location.state as { notes?: string } | null;
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [followUpValue, setFollowUpValue] = useState('');
  const [followUpUnit, setFollowUpUnit] = useState<'days' | 'weeks' | 'months'>(
    'days',
  );
  const [followUpEnabled, setFollowUpEnabled] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [existingPrescriptionNotes, setExistingPrescriptionNotes] = useState<
    string | undefined
  >(undefined);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicineErrors, setMedicineErrors] = useState<
    Record<string, Record<string, string>>
  >({});
  const { data: visit, isLoading: visitLoading } = useVisit(visitId || '');
  const { data: prescriptionData, isLoading: prescriptionLoading } =
    usePrescription(visit?.prescription_id || '');
  const { data: patient } = usePatient(visit?.patientId || '');
  const savePrescriptionMutation = useSavePrescription(visitId || '');
  const updateVisitStatusMutation = useUpdateVisitStatus();
  const sendPrescriptionMutation = useSendPrescription();

  const createMedicine = (medicineData: Omit<Medicine, 'id'>): Medicine => ({
    ...medicineData,
    id: `medicine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  });

  useEffect(() => {
    if (!visitId) {
      navigate('/visits');
    }
  }, [visitId, navigate]);

  useEffect(() => {
    if (visitId && !visitLoading && !visit) {
      setError('Visit not found');
      toast.add({
        title: 'Visit not found',
        type: 'error',
      });
    }
  }, [visitId, visitLoading, visit]);

  useEffect(() => {
    if (initialized || !visit) return;
    setError(null);

    if (visit.prescription_id && prescriptionData) {
      setMedicines(
        prescriptionData.medicines.length > 0
          ? prescriptionData.medicines
          : [
              createMedicine({
                name: '',
                dosage: '',
                duration: '',
                notes: '',
              }),
            ],
      );
      setFollowUp(prescriptionData.followUp || null);
      setExistingPrescriptionNotes(prescriptionData.notes);
      if (prescriptionData.followUp) {
        setFollowUpValue(prescriptionData.followUp.value.toString());
        setFollowUpUnit(prescriptionData.followUp.unit);
        setFollowUpEnabled(true);
      } else {
        setFollowUpEnabled(false);
      }
      setInitialized(true);
      return;
    }

    if (visit.prescription_id && !prescriptionLoading && !prescriptionData) {
      const initialMedicine: Medicine = createMedicine({
        name: '',
        dosage: '',
        duration: '',
        notes: '',
      });
      setMedicines([initialMedicine]);
      setInitialized(true);
      return;
    }

    if (!visit.prescription_id) {
      const initialMedicine: Medicine = createMedicine({
        name: '',
        dosage: '',
        duration: '',
        notes: '',
      });
      setMedicines([initialMedicine]);
      setInitialized(true);
    }
  }, [initialized, visit, prescriptionData, prescriptionLoading]);

  const handleAddMedicine = () => {
    const newMedicine: Medicine = createMedicine({
      name: '',
      dosage: '',
      duration: '',
      notes: '',
    });
    setMedicines([...medicines, newMedicine]);
  };

  /**
   * Formats dosage input to "X-Y-Z" format (e.g., "1-0-1")
   * Only allows digits and automatically inserts dashes
   */
  const formatDosage = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 3 digits
    const limitedDigits = digits.slice(0, 3);

    // Format with dashes: X-Y-Z
    if (limitedDigits.length === 0) return '';
    if (limitedDigits.length === 1) return limitedDigits;
    if (limitedDigits.length === 2)
      return `${limitedDigits[0]}-${limitedDigits[1]}`;
    return `${limitedDigits[0]}-${limitedDigits[1]}-${limitedDigits[2]}`;
  };

  const handleUpdateMedicine = (
    id: string,
    field: keyof Medicine,
    value: string,
  ) => {
    // Auto-format dosage field
    const formattedValue = field === 'dosage' ? formatDosage(value) : value;

    setMedicines(
      medicines.map((med) =>
        med.id === id ? { ...med, [field]: formattedValue } : med,
      ),
    );
    // Clear error for this field when user starts typing
    if (medicineErrors[id]?.[field]) {
      setMedicineErrors((prev) => {
        const updated = { ...prev };
        if (updated[id]) {
          const { [field]: _, ...rest } = updated[id];
          if (Object.keys(rest).length === 0) {
            delete updated[id];
          } else {
            updated[id] = rest;
          }
        }
        return updated;
      });
    }
  };

  const handleRemoveMedicine = (id: string) => {
    // Prevent removing the last medicine - always keep at least one
    if (medicines.length > 1) {
      setMedicines(medicines.filter((med) => med.id !== id));
    }
  };

  const handleSavePrescription = async (): Promise<boolean> => {
    const prescription: Prescription = {
      medicines: medicines.filter((med) => med.name.trim() !== ''),
      followUp: followUp || undefined,
      // Prefer notes passed from ConsultationScreen, otherwise existing prescription notes
      notes: navigationState?.notes ?? existingPrescriptionNotes ?? undefined,
    };

    if (prescription.medicines.length === 0) {
      toast.add({
        type: 'error',
        title: 'Please add at least one medicine',
      });
      return false;
    }

    try {
      if (!visitId) {
        toast.add({
          type: 'error',
          title: 'Visit not found',
        });
        return false;
      }

      const result = await savePrescriptionMutation.mutateAsync(prescription);
      if (!result?.prescriptionId) {
        toast.add({
          type: 'error',
          title: 'Failed to save prescription',
        });
        return false;
      }

      toast.add({
        type: 'success',
        title: 'Prescription saved',
      });
      return true;
    } catch (error: any) {
      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);

        // Process medicine-specific errors (format: medicine_0_notes, medicine_1_dosage, etc.)
        const newMedicineErrors: Record<string, Record<string, string>> = {};

        Object.entries(validationErrors).forEach(([key, message]) => {
          const medicineMatch = key.match(/^medicine_(\d+)_(.+)$/);
          if (medicineMatch) {
            const index = parseInt(medicineMatch[1], 10);
            const fieldName = medicineMatch[2];

            // Find the medicine ID at this index
            if (medicines[index]) {
              const medicineId = medicines[index].id;
              if (!newMedicineErrors[medicineId]) {
                newMedicineErrors[medicineId] = {};
              }
              newMedicineErrors[medicineId][fieldName] = message;
            }
          }
        });

        setMedicineErrors(newMedicineErrors);
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      } else {
        setMedicineErrors({});
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      }
      return false;
    }
  };

  const handleFinishVisit = async () => {
    const saved = await handleSavePrescription();
    if (!saved || !visitId) {
      return;
    }

    // Mark visit as completed
    await updateVisitStatusMutation.mutateAsync({
      id: visitId,
      status: 'completed',
    });

    // Redirect to print preview for this visit
    navigate(`/print-preview/${visitId}`);
    toast.add({
      type: 'success',
      title: 'Visit completed. Ready to print.',
    });
  };

  const handleWhatsApp = async () => {
    if (medicines.filter((med) => med.name.trim() !== '').length === 0) {
      toast.add({
        type: 'error',
        title: 'Please add at least one medicine before sending',
      });
      return;
    }
    await handleSavePrescription();
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!visitId) return;

    if (!visit || !patient) return;

    const result = await sendPrescriptionMutation.mutateAsync({
      patientId: patient.id,
      visitId: visit.id,
      mobile: patient.mobile,
      prescription: {
        medicines: prescriptionPreview,
        followUp: followUp || undefined,
      },
    });

    setIsWhatsAppModalOpen(false);

    // Update visit status to completed after sending WhatsApp
    if (visitId) {
      await updateVisitStatusMutation.mutateAsync({
        id: visitId,
        status: 'completed',
      });
    }

    if (result.success) {
      toast.add({
        type: 'success',
        title: 'Prescription sent on WhatsApp',
        description:
          result.message || 'The prescription has been shared with the patient',
      });
    } else {
      toast.add({
        type: 'error',
        title: 'Failed to send',
        description:
          result.message || 'Could not send prescription on WhatsApp',
      });
    }
  };

  const handlePrint = async () => {
    if (medicines.filter((med) => med.name.trim() !== '').length === 0) {
      toast.add({
        type: 'error',
        title: 'Please add at least one medicine before printing',
      });
      return;
    }
    const saved = await handleSavePrescription();
    if (saved && visitId) {
      // Small delay to ensure the visit is updated in the backend
      await new Promise((resolve) => setTimeout(resolve, 300));
      navigate(`/print-preview/${visitId}`);
    }
  };

  const handleFollowUpValueChange = (value: string) => {
    setFollowUpValue(value);
    // Only update followUp if value is valid
    if (value && Number(value) > 0) {
      setFollowUp({
        value: Number(value),
        unit: followUpUnit,
      });
    } else {
      // Clear followUp if value becomes invalid, but keep input visible
      setFollowUp(null);
    }
  };

  const handleFollowUpUnitChange = (unit: 'days' | 'weeks' | 'months') => {
    setFollowUpUnit(unit);
    // Only update followUp if value is valid
    if (followUpValue && Number(followUpValue) > 0) {
      setFollowUp({
        value: Number(followUpValue),
        unit,
      });
    }
  };

  const loading =
    visitLoading ||
    (visit?.prescription_id ? prescriptionLoading : false) ||
    !initialized;

  const prescriptionPreview = medicines.filter((med) => med.name.trim() !== '');

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">Loading prescription...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Show error state only if we have an error and no visit (and not loading)
  if (error && !visit && !loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => navigate('/visits')}>Go Back to Visits</Button>
        </div>
      </div>
    );
  }

  // If no visit after loading completes, show message
  if (!visit && !loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Visit not found</div>
          <Button onClick={() => navigate('/visits')}>Go Back to Visits</Button>
        </div>
      </div>
    );
  }

  // Safety check: if visit is still null after loading, return null to prevent blank screen
  if (!visit) {
    return null;
  }

  return (
    <div className="h-screen bg-background overflow-x-hidden pb-60 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Visit Progress Stepper */}
        <Card.Root className="mb-4 border-primary/10">
          <Card.Panel className="pt-4 pb-4">
            <Stepper
              steps={visitSteps}
              currentStep={getVisitStep(visit, 'prescription')}
            />
          </Card.Panel>
        </Card.Root>

        <div className="bg-white rounded-lg border border-primary/10 shadow-sm p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-semibold text-teal-900 mb-4">
              Prescription
            </h2>

            {/* Mobile Card Layout */}
            <div className="md:hidden space-y-4">
              {medicines.map((medicine, index) => (
                <div
                  key={medicine.id}
                  className="border border-primary/10 rounded-lg p-4 bg-white space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-teal-700">
                      Medicine #{index + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      {medicines.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicine(medicine.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        >
                          Remove
                        </Button>
                      )}
                      {index === medicines.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleAddMedicine}
                          className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-2"
                        >
                          <Plus />
                        </Button>
                      )}
                    </div>
                  </div>
                  <MedicationInput
                    label="Medicine Name"
                    value={medicine.name}
                    onChange={(value) =>
                      handleUpdateMedicine(medicine.id, 'name', value)
                    }
                    placeholder="Search medication..."
                    className="w-full"
                    error={
                      medicineErrors[medicine.id]?.medicine ||
                      medicineErrors[medicine.id]?.name
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="name">Dosage</Label>
                      <Input
                        id="name"
                        type="text"
                        inputMode="numeric"
                        value={medicine.dosage}
                        onChange={(e) =>
                          handleUpdateMedicine(
                            medicine.id,
                            'dosage',
                            e.target.value,
                          )
                        }
                        placeholder="e.g., 1-0-1"
                        className="w-full"
                        // TODO
                        // error={medicineErrors[medicine.id]?.dosage}
                        maxLength={5}
                      />
                    </div>
                    <div className="flex flex-col items-start gap-2">
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        value={medicine.duration}
                        onChange={(e) =>
                          handleUpdateMedicine(
                            medicine.id,
                            'duration',
                            e.target.value,
                          )
                        }
                        placeholder="e.g., 5 days"
                        className="w-full"
                        // error={medicineErrors[medicine.id]?.duration}
                      />
                    </div>
                  </div>
                  <NotesInput
                    label="Notes (Optional)"
                    value={medicine.notes || ''}
                    onChange={(value: string) =>
                      handleUpdateMedicine(medicine.id, 'notes', value)
                    }
                    placeholder="Select or type notes (e.g., before food, after food)"
                    className="w-full"
                    error={medicineErrors[medicine.id]?.notes}
                  />
                </div>
              ))}
            </div>

            {/* Desktop Table Layout */}
            <div className="hidden md:block overflow-x-auto border border-teal-100 rounded-lg relative">
              <Table.Root>
                <Table.Header className="bg-teal-50">
                  <Table.Row>
                    <Table.Head className="text-teal-900 font-semibold">
                      Medicine
                    </Table.Head>
                    <Table.Head className="text-teal-900 font-semibold">
                      Dosage
                    </Table.Head>
                    <Table.Head className="text-teal-900 font-semibold">
                      Duration
                    </Table.Head>
                    <Table.Head className="text-teal-900 font-semibold">
                      Notes
                    </Table.Head>
                    <Table.Head className="text-teal-900 font-semibold w-24">
                      Action
                    </Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {medicines.map((medicine, index) => (
                    <Table.Row
                      key={medicine.id}
                      className="hover:bg-teal-50/50"
                    >
                      <Table.Cell className="min-w-62.5">
                        <MedicationInput
                          value={medicine.name}
                          onChange={(value) =>
                            handleUpdateMedicine(medicine.id, 'name', value)
                          }
                          placeholder="Search medication..."
                          className="w-full"
                          error={
                            medicineErrors[medicine.id]?.medicine ||
                            medicineErrors[medicine.id]?.name
                          }
                        />
                      </Table.Cell>
                      <Table.Cell className="min-w-45">
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={medicine.dosage}
                          onChange={(e) =>
                            handleUpdateMedicine(
                              medicine.id,
                              'dosage',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., 1-0-1"
                          className="w-full"
                          // TODO
                          // error={medicineErrors[medicine.id]?.dosage}
                          maxLength={5}
                        />
                      </Table.Cell>
                      <Table.Cell className="min-w-45">
                        <Input
                          value={medicine.duration}
                          onChange={(e) =>
                            handleUpdateMedicine(
                              medicine.id,
                              'duration',
                              e.target.value,
                            )
                          }
                          placeholder="e.g., 5 days"
                          className="w-full"
                          // TODO
                          // error={medicineErrors[medicine.id]?.duration}
                        />
                      </Table.Cell>
                      <Table.Cell className="min-w-50">
                        <NotesInput
                          value={medicine.notes || ''}
                          onChange={(value: string) =>
                            handleUpdateMedicine(medicine.id, 'notes', value)
                          }
                          placeholder="Select or type notes"
                          className="w-full"
                          error={medicineErrors[medicine.id]?.notes}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center justify-end gap-2">
                          {medicines.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                            >
                              <Trash2 />
                            </Button>
                          )}
                          {index === medicines.length - 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleAddMedicine}
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-8 px-2"
                            >
                              <Plus />
                            </Button>
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>
          </div>

          {/* Follow-up Section */}
          <div className="mt-6 p-4 md:p-6 bg-teal-50 rounded-lg border border-primary/10">
            <h3 className="text-base md:text-lg font-semibold text-teal-900 mb-4">
              Follow-up
            </h3>
            <RadioGroup.Root
              className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 md:gap-4"
              value={followUpEnabled ? 'yes' : 'none'}
              onValueChange={(value) => {
                if (value === 'none') {
                  setFollowUpEnabled(false);
                  setFollowUp(null);
                  setFollowUpValue('');
                } else {
                  setFollowUpEnabled(true);
                  if (!followUpValue) {
                    setFollowUpValue('7');
                    setFollowUp({
                      value: 7,
                      unit: followUpUnit,
                    });
                  } else if (followUpValue && Number(followUpValue) > 0) {
                    setFollowUp({
                      value: Number(followUpValue),
                      unit: followUpUnit,
                    });
                  }
                }
              }}
            >
              <div className="flex items-center gap-2">
                <RadioGroup.Item value="none" id="none" />
                <label htmlFor="none" className="text-sm font-medium">
                  No follow-up
                </label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroup.Item value="yes" id="yes" />
                <label htmlFor="yes" className="text-sm font-medium">
                  Follow-up after
                </label>
              </div>
            </RadioGroup.Root>

            {followUpEnabled && (
              <div className="flex items-center gap-2 flex-1 sm:flex-initial mt-3">
                <Input
                  type="number"
                  value={followUpValue}
                  onChange={(e) => handleFollowUpValueChange(e.target.value)}
                  placeholder="Value"
                  className="w-24 sm:w-32"
                  min="1"
                />

                <Select.Root
                  value={followUpUnit}
                  onValueChange={(value) =>
                    handleFollowUpUnitChange(
                      value as 'days' | 'weeks' | 'months',
                    )
                  }
                >
                  <Select.Trigger className="flex-1 sm:flex-initial sm:w-auto">
                    <Select.Value placeholder="Unit" />
                  </Select.Trigger>

                  <Select.Popup>
                    <Select.Item value="days">Days</Select.Item>
                    <Select.Item value="weeks">Weeks</Select.Item>
                    <Select.Item value="months">Months</Select.Item>
                  </Select.Popup>
                </Select.Root>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-primary/10 shadow-lg z-40 md:ml-64 ml-0">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox.Root
                id="whatsapp-checkbox"
                checked={whatsappEnabled}
                onCheckedChange={(checked) => setWhatsappEnabled(checked)}
              />
              <label
                htmlFor="whatsapp-checkbox"
                className="text-sm font-medium text-gray-700"
              >
                Send on WhatsApp
              </label>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={handlePrint}
                className="shadow-sm w-full sm:w-auto"
                size="sm"
              >
                Print
              </Button>
              {whatsappEnabled && (
                <Button
                  disabled={sendPrescriptionMutation.isPending}
                  loading={sendPrescriptionMutation.isPending}
                  variant="outline"
                  onClick={handleWhatsApp}
                  className="shadow-sm w-full sm:w-auto"
                  size="sm"
                >
                  Send on WhatsApp
                </Button>
              )}
              <Button
                disabled={
                  savePrescriptionMutation.isPending ||
                  updateVisitStatusMutation.isPending
                }
                loading={
                  savePrescriptionMutation.isPending ||
                  updateVisitStatusMutation.isPending
                }
                onClick={handleFinishVisit}
                size="sm"
                className="shadow-lg w-full sm:w-auto"
              >
                Save & Finish Visit
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SendWhatsappModal
        open={isWhatsAppModalOpen}
        onOpenChange={setIsWhatsAppModalOpen}
        medicines={prescriptionPreview}
        followUp={followUp}
        onSend={handleSendWhatsApp}
      />
    </div>
  );
}
