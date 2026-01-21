import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from '../components/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/Table';
import { Stepper } from '../components/ui/Stepper';
import { Card, CardContent } from '../components/ui/Card';
import { visitService } from '../services/visitService';
import { prescriptionService } from '../services/prescriptionService';
import { whatsappService } from '../services/whatsappService';
import { patientService } from '../services/patientService';
import { toast } from '../utils/toast';
import { getVisitStep, visitSteps } from '../utils/visitStepper';
import type { Medicine, Prescription, FollowUp, Visit } from '../types';

export default function PrescriptionScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [followUp, setFollowUp] = useState<FollowUp | null>(null);
  const [followUpValue, setFollowUpValue] = useState('');
  const [followUpUnit, setFollowUpUnit] = useState<'days' | 'weeks' | 'months'>('days');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [visit, setVisit] = useState<Visit | null>(null);

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
      if (visitData.prescription) {
        setMedicines(visitData.prescription.medicines || []);
        setFollowUp(visitData.prescription.followUp || null);
        if (visitData.prescription.followUp) {
          setFollowUpValue(visitData.prescription.followUp.value.toString());
          setFollowUpUnit(visitData.prescription.followUp.unit);
        }
      }
    };

    loadVisit();
  }, [visitId, navigate]);

  const handleAddMedicine = () => {
    const newMedicine: Medicine = prescriptionService.createMedicine({
      name: '',
      dosage: '',
      duration: '',
      notes: '',
    });
    setMedicines([...medicines, newMedicine]);
  };

  const handleUpdateMedicine = (id: string, field: keyof Medicine, value: string) => {
    setMedicines(
      medicines.map((med) => (med.id === id ? { ...med, [field]: value } : med))
    );
  };

  const handleRemoveMedicine = (id: string) => {
    setMedicines(medicines.filter((med) => med.id !== id));
  };

  const handleSavePrescription = async () => {
    const prescription: Prescription = {
      medicines: medicines.filter((med) => med.name.trim() !== ''),
      followUp: followUp || undefined,
    };

    if (prescription.medicines.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    const success = await prescriptionService.saveToVisit(visitId!, prescription);
    if (success) {
      // Reload visit to update stepper
      const updatedVisit = await visitService.getById(visitId!);
      if (updatedVisit) {
        setVisit(updatedVisit);
      }
      toast.success('Prescription saved');
    } else {
      toast.error('Failed to save prescription');
    }
  };

  const handleFinishVisit = async () => {
    await handleSavePrescription();
    if (visitId) {
      await visitService.complete(visitId);
    }
    navigate('/visits');
    toast.success('Visit completed');
  };

  const handleWhatsApp = async () => {
    if (medicines.filter((med) => med.name.trim() !== '').length === 0) {
      toast.error('Please add at least one medicine before sending');
      return;
    }
    await handleSavePrescription();
    setIsWhatsAppModalOpen(true);
  };

  const handleSendWhatsApp = async () => {
    if (!visitId) return;

    const visit = await visitService.getById(visitId);
    if (!visit) return;

    const patient = await patientService.getById(visit.patientId);
    if (!patient) return;

    const result = await whatsappService.sendPrescription({
      patientId: patient.id,
      visitId: visit.id,
      mobile: patient.mobile,
      prescription: {
        medicines: prescriptionPreview,
        followUp: followUp || undefined,
      },
    });

    setIsWhatsAppModalOpen(false);
    if (result.success) {
      toast.success('Prescription sent on WhatsApp', result.message || 'The prescription has been shared with the patient');
    } else {
      toast.error('Failed to send', result.message || 'Could not send prescription on WhatsApp');
    }
  };

  const handlePrint = async () => {
    if (medicines.filter((med) => med.name.trim() !== '').length === 0) {
      toast.error('Please add at least one medicine before printing');
      return;
    }
    await handleSavePrescription();
    navigate(`/print-preview/${visitId}`);
  };

  const handleFollowUpChange = () => {
    if (followUpValue && Number(followUpValue) > 0) {
      setFollowUp({
        value: Number(followUpValue),
        unit: followUpUnit,
      });
    } else {
      setFollowUp(null);
    }
  };

  useEffect(() => {
    handleFollowUpChange();
  }, [followUpValue, followUpUnit]);

  const prescriptionPreview = medicines.filter((med) => med.name.trim() !== '');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden pb-32 md:pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        {/* Visit Progress Stepper */}
        <Card className="mb-4 border-teal-200">
          <CardContent className="pt-4 pb-4">
            <Stepper steps={visitSteps} currentStep={getVisitStep(visit)} />
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg border border-teal-200 shadow-sm p-4 md:p-6">
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl md:text-2xl font-semibold text-teal-900">Prescription</h2>
              <Button onClick={handleAddMedicine} variant="outline" className="shadow-sm w-full sm:w-auto">
                + Add Medicine
              </Button>
            </div>

            {medicines.length > 0 && (
              <>
                {/* Mobile Card Layout */}
                <div className="md:hidden space-y-4">
                  {medicines.map((medicine) => (
                    <div
                      key={medicine.id}
                      className="border border-teal-200 rounded-lg p-4 bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-teal-700">Medicine #{medicines.indexOf(medicine) + 1}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicine(medicine.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                        >
                          Remove
                        </Button>
                      </div>
                      <Input
                        label="Medicine Name"
                        value={medicine.name}
                        onChange={(e) =>
                          handleUpdateMedicine(medicine.id, 'name', e.target.value)
                        }
                        placeholder="Medicine name"
                        className="w-full"
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Dosage"
                          value={medicine.dosage}
                          onChange={(e) =>
                            handleUpdateMedicine(medicine.id, 'dosage', e.target.value)
                          }
                          placeholder="e.g., 1-0-1"
                          className="w-full"
                        />
                        <Input
                          label="Duration"
                          value={medicine.duration}
                          onChange={(e) =>
                            handleUpdateMedicine(medicine.id, 'duration', e.target.value)
                          }
                          placeholder="e.g., 5 days"
                          className="w-full"
                        />
                      </div>
                      <Input
                        label="Notes (Optional)"
                        value={medicine.notes || ''}
                        onChange={(e) =>
                          handleUpdateMedicine(medicine.id, 'notes', e.target.value)
                        }
                        placeholder="Optional notes"
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                {/* Desktop Table Layout */}
                <div className="hidden md:block overflow-x-auto border border-teal-100 rounded-lg">
                  <Table>
                    <TableHeader className="bg-teal-50">
                      <TableRow>
                        <TableHead className="text-teal-900 font-semibold">Medicine</TableHead>
                        <TableHead className="text-teal-900 font-semibold">Dosage</TableHead>
                        <TableHead className="text-teal-900 font-semibold">Duration</TableHead>
                        <TableHead className="text-teal-900 font-semibold">Notes</TableHead>
                        <TableHead className="text-teal-900 font-semibold w-24">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {medicines.map((medicine) => (
                        <TableRow key={medicine.id} className="hover:bg-teal-50/50">
                          <TableCell className="min-w-[250px]">
                            <Input
                              value={medicine.name}
                              onChange={(e) =>
                                handleUpdateMedicine(medicine.id, 'name', e.target.value)
                              }
                              placeholder="Medicine name"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <Input
                              value={medicine.dosage}
                              onChange={(e) =>
                                handleUpdateMedicine(medicine.id, 'dosage', e.target.value)
                              }
                              placeholder="e.g., 1-0-1"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell className="min-w-[180px]">
                            <Input
                              value={medicine.duration}
                              onChange={(e) =>
                                handleUpdateMedicine(medicine.id, 'duration', e.target.value)
                              }
                              placeholder="e.g., 5 days"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell className="min-w-[200px]">
                            <Input
                              value={medicine.notes || ''}
                              onChange={(e) =>
                                handleUpdateMedicine(medicine.id, 'notes', e.target.value)
                              }
                              placeholder="Optional notes"
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>

          {/* Follow-up Section */}
          <div className="mt-6 p-4 md:p-6 bg-teal-50 rounded-lg border border-teal-200">
            <h3 className="text-base md:text-lg font-semibold text-teal-900 mb-4">Follow-up</h3>
            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 md:gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="followup-none"
                  name="followup"
                  checked={!followUp}
                  onChange={() => {
                    setFollowUp(null);
                    setFollowUpValue('');
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="followup-none" className="text-sm font-medium">
                  No follow-up
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="followup-yes"
                  name="followup"
                  checked={!!followUp}
                  onChange={() => {
                    if (!followUpValue) setFollowUpValue('7');
                  }}
                  className="w-4 h-4"
                />
                <label htmlFor="followup-yes" className="text-sm font-medium">
                  Follow-up after
                </label>
              </div>
              {followUp && (
                <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                  <Input
                    type="number"
                    value={followUpValue}
                    onChange={(e) => setFollowUpValue(e.target.value)}
                    placeholder="Value"
                    className="w-24 sm:w-32"
                    min="1"
                  />
                  <select
                    value={followUpUnit}
                    onChange={(e) =>
                      setFollowUpUnit(e.target.value as 'days' | 'weeks' | 'months')
                    }
                    className="h-10 px-3 border border-teal-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white text-gray-900 flex-1 sm:flex-initial sm:w-auto"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-teal-200 shadow-lg z-40 md:ml-64 ml-0">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="whatsapp-checkbox"
                checked={whatsappEnabled}
                onChange={(e) => setWhatsappEnabled(e.target.checked)}
                className="w-4 h-4 text-teal-600 border-teal-300 rounded focus:ring-teal-500"
              />
              <label htmlFor="whatsapp-checkbox" className="text-sm font-medium text-gray-700">
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
                  variant="outline" 
                  onClick={handleWhatsApp} 
                  className="shadow-sm w-full sm:w-auto"
                  size="sm"
                >
                  Send on WhatsApp
                </Button>
              )}
              <Button 
                onClick={handleFinishVisit} 
                size="lg" 
                className="shadow-lg w-full sm:w-auto"
              >
                Save & Finish Visit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Modal */}
      <Modal
        open={isWhatsAppModalOpen}
        onOpenChange={setIsWhatsAppModalOpen}
        title="Send Prescription on WhatsApp"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsWhatsAppModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendWhatsApp}>Send</Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Preview of prescription to be sent:
          </p>
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            {prescriptionPreview.length > 0 ? (
              <div className="space-y-3">
                {prescriptionPreview.map((med, idx) => (
                  <div key={idx} className="border-b border-gray-200 pb-2">
                    <div className="font-medium">{med.name}</div>
                    <div className="text-sm text-gray-600">
                      {med.dosage} - {med.duration}
                      {med.notes && ` (${med.notes})`}
                    </div>
                  </div>
                ))}
                {followUp && (
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <strong>Follow-up:</strong> After {followUp.value} {followUp.unit}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No medicines added</p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
