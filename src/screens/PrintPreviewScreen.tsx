import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { visitService } from '../services/visitService';
import { patientService } from '../services/patientService';
import { printUtils } from '../utils/print';
import type { Patient, Visit } from '../types';

export default function PrintPreviewScreen() {
  const { visitId } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const [visit, setVisit] = useState<Visit | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState<'a4' | 'thermal'>('a4');

  useEffect(() => {
    const loadData = async () => {
      if (!visitId) {
        navigate('/patient-search');
        return;
      }

      const currentVisit = await visitService.getById(visitId);
      if (!currentVisit || !currentVisit.prescription) {
        navigate('/patient-search');
        return;
      }

      setVisit(currentVisit);
      const patientData = await patientService.getById(currentVisit.patientId);
      setPatient(patientData);
    };

    loadData();
  }, [visitId, navigate]);

  const handlePrint = () => {
    if (!visit || !patient || !visit.prescription) return;

    if (activeTab === 'a4') {
      printUtils.printA4(patient, visit, visit.prescription);
    } else {
      printUtils.printThermal(patient, visit, visit.prescription);
    }
  };

  if (!visit || !patient || !visit.prescription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const visitDate = new Date(visit.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const CLINIC_NAME = import.meta.env.VITE_CLINIC_NAME || 'Clinic OPD Management';

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Print Preview</h1>
          <Button onClick={handlePrint} size="lg">
            Print
          </Button>
        </div>

        <Tabs.Root value={activeTab} onValueChange={(value) => setActiveTab(value as 'a4' | 'thermal')}>
          <Tabs.List className="flex border-b border-gray-200 mb-6">
            <Tabs.Trigger
              value="a4"
              className="px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-700"
            >
              A4 Prescription
            </Tabs.Trigger>
            <Tabs.Trigger
              value="thermal"
              className="px-6 py-3 text-sm font-medium border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 hover:text-gray-700"
            >
              Thermal
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="a4">
            <Card className="p-8 bg-white">
              <div className="max-w-[210mm] mx-auto">
                {/* A4 Layout */}
                <div className="text-center mb-8 pb-4 border-b-2 border-black">
                  <div className="text-2xl font-bold">{CLINIC_NAME}</div>
                </div>

                <div className="mb-6 space-y-2">
                  <p><strong>Patient Name:</strong> {patient.name}</p>
                  <p>
                    <strong>Age:</strong> {patient.age || 'N/A'}{' '}
                    {patient.gender && `| Gender: ${patient.gender === 'M' ? 'Male' : 'Female'}`}
                  </p>
                  <p><strong>Mobile:</strong> {patient.mobile}</p>
                  <p><strong>Date:</strong> {visitDate}</p>
                </div>

                {visit.notes && (
                  <div className="mb-6">
                    <strong>Notes:</strong> {visit.notes}
                  </div>
                )}

                <table className="w-full border-collapse border border-gray-300 mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 px-4 py-2 text-left">Medicine</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Dosage</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Duration</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visit.prescription.medicines.map((med, idx) => (
                      <tr key={idx}>
                        <td className="border border-gray-300 px-4 py-2">{med.name}</td>
                        <td className="border border-gray-300 px-4 py-2">{med.dosage}</td>
                        <td className="border border-gray-300 px-4 py-2">{med.duration}</td>
                        <td className="border border-gray-300 px-4 py-2">{med.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {visit.prescription.followUp && (
                  <p className="mb-6">
                    <strong>Follow-up:</strong> After {visit.prescription.followUp.value}{' '}
                    {visit.prescription.followUp.unit}
                  </p>
                )}

                <div className="mt-16 text-right">
                  <div className="inline-block border-t border-black w-48 mt-12"></div>
                  <p className="mt-2">Doctor's Signature</p>
                </div>
              </div>
            </Card>
          </Tabs.Content>

          <Tabs.Content value="thermal">
            <Card className="p-4 bg-white">
              <div className="max-w-[70mm] mx-auto font-mono text-xs">
                {/* Thermal Layout */}
                <div className="text-center mb-4 pb-2 border-b border-dashed border-black">
                  <div className="text-sm font-bold">{CLINIC_NAME}</div>
                </div>

                <div className="mb-4 space-y-1 text-xs">
                  <div><strong>{patient.name}</strong></div>
                  <div>
                    {patient.age ? `Age: ${patient.age}` : ''}{' '}
                    {patient.gender && `| ${patient.gender === 'M' ? 'M' : 'F'}`}
                  </div>
                  <div>{patient.mobile} | {new Date(visit.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                </div>

                {visit.prescription.medicines.map((med, idx) => (
                  <div key={idx} className="mb-3 pb-2 border-b border-dotted border-gray-400">
                    <div className="font-bold mb-1">{med.name}</div>
                    <div className="ml-1 text-xs">
                      {med.dosage} - {med.duration}
                      {med.notes && ` (${med.notes})`}
                    </div>
                  </div>
                ))}

                {visit.prescription.followUp && (
                  <div className="mt-4 text-center font-bold">
                    Follow-up: {visit.prescription.followUp.value} {visit.prescription.followUp.unit}
                  </div>
                )}

                <div className="mt-8 text-center">
                  <div className="border-t border-black w-full my-4"></div>
                  <div className="text-xs">Doctor's Signature</div>
                </div>
              </div>
            </Card>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
}
