import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '../types';
import {
  useCreatePatient,
  usePatientSearch,
  useRecentPatients,
} from '../queries/patients.queries';
import { useFiltersStore } from '../stores/filters.store';
import { useCreateVisit } from '../queries/visits.queries';
import { useQueryClient } from '@tanstack/react-query';
import { fetchVisitsByPatient } from '../queries/visits.queries';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog } from '@/components/ui/dialog';

export default function PatientSearchScreen() {
  const navigate = useNavigate();
  const patientSearch = useFiltersStore((state) => state.patientSearch);
  const setPatientSearch = useFiltersStore((state) => state.setPatientSearch);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const searchInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const createPatientMutation = useCreatePatient();
  const createVisitMutation = useCreateVisit();
  const { data: recentPatients = [] } = useRecentPatients(50);
  const { data: searchResults = [] } = usePatientSearch(patientSearch);

  const results: Patient[] = useMemo(() => {
    if (patientSearch.length >= 2) return searchResults;
    return recentPatients;
  }, [patientSearch, searchResults, recentPatients]);

  // Auto-focus search input
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const handlePatientClick = async (patient: Patient) => {
    // Get or create active visit
    const visits = await fetchVisitsByPatient(queryClient, patient.id);
    let visit = visits.find((v) => v.status === 'in_progress') || null;
    if (!visit) {
      visit = await createVisitMutation.mutateAsync({ patientId: patient.id });
    }
    navigate(`/visit/${visit.id}`);
  };

  const handleStartVisit = async (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent card click
    try {
      const visit = await createVisitMutation.mutateAsync({
        patientId: patient.id,
        status: 'waiting',
      });
      navigate(`/visit/${visit.id}`);
    } catch (error) {
      console.error('Failed to create visit:', error);
    }
  };

  const handleAddNewPatient = () => {
    setIsModalOpen(true);
    setNewPatient({ name: '', mobile: '', age: '', gender: '' });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!newPatient.name.trim()) {
      newErrors.name = 'Name is required';
    }
    const phoneValidation = validatePhoneNumber(newPatient.mobile);
    if (!phoneValidation.isValid) {
      newErrors.mobile =
        phoneValidation.error || 'Please enter a valid mobile number';
    }
    if (
      newPatient.age &&
      (isNaN(Number(newPatient.age)) || Number(newPatient.age) < 0)
    ) {
      newErrors.age = 'Age must be a valid number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePatient = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const patient = await createPatientMutation.mutateAsync({
        name: newPatient.name.trim(),
        mobile: newPatient.mobile.trim(),
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender || undefined,
      });

      // Create visit for new patient with waiting status
      const visit = await createVisitMutation.mutateAsync({
        patientId: patient.id,
        status: 'waiting',
      });
      setIsModalOpen(false);
      navigate(`/visit/${visit.id}`);
    } catch (error: any) {
      console.error('Failed to create patient:', error);

      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));
        // Show general error message (toast can be added if needed)
        console.error('Validation errors:', validationErrors);
      } else {
        console.error('Error:', getErrorMessage(error));
      }
    }
  };

  const maskMobile = (mobile: string): string => {
    if (mobile.length <= 4) return mobile;
    return '****' + mobile.slice(-4);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="sticky z-10 bg-white border-b border-teal-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center gap-4">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder="Search by name or mobile (min 2 characters)..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full"
          />
          <Button onClick={handleAddNewPatient} className="w-40">
            + Add Patient
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {results.length > 0 && (
          <div className="bg-white rounded-lg border border-teal-200 shadow-sm">
            <ul className="divide-y divide-teal-100">
              {results.map((patient) => (
                <li
                  key={patient.id}
                  onClick={() => handlePatientClick(patient)}
                  className="px-4 py-3 hover:bg-teal-50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {patient.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {maskMobile(patient.mobile)}
                        {patient.age && ` • Age: ${patient.age}`}
                        {patient.gender &&
                          ` • ${patient.gender === 'M' ? 'Male' : 'Female'}`}
                      </div>
                    </div>
                    <Button
                      onClick={(e) => handleStartVisit(e, patient)}
                      size="sm"
                      className="shrink-0"
                    >
                      Start Visit
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {patientSearch.length >= 2 && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No patients found. Try a different search or add a new patient.
          </div>
        )}

        {patientSearch.length < 2 && results.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No patients found. Add a new patient to get started.
          </div>
        )}

        {patientSearch.length < 2 && results.length > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            Showing all patients ({results.length}). Start typing to search.
          </div>
        )}
      </div>

      <Dialog.Root
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        // TODO: @sandeep add size
        // size="lg"
      >
        <Dialog.Popup>
          <Dialog.Header>
            <Dialog.Title>Add New Patient</Dialog.Title>
          </Dialog.Header>
          <Dialog.Panel>
            <div className="space-y-5">
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                  // error={errors.name}
                  placeholder="Enter patient name"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePatient();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="mobile">Mobile *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={newPatient.mobile}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      mobile: formatPhoneInput(e.target.value),
                    })
                  }
                  // TODO
                  // error={errors.mobile}
                  placeholder="Enter mobile number (e.g., +91 9876543210)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePatient();
                    }
                  }}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={newPatient.age}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, age: e.target.value })
                  }
                  // TODO
                  // error={errors.age}
                  placeholder="Enter age (optional)"
                  min="0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSavePatient();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender (optional)
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="M"
                      checked={newPatient.gender === 'M'}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          gender: e.target.value as 'M' | 'F',
                        })
                      }
                      className="mr-2"
                    />
                    Male
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="F"
                      checked={newPatient.gender === 'F'}
                      onChange={(e) =>
                        setNewPatient({
                          ...newPatient,
                          gender: e.target.value as 'M' | 'F',
                        })
                      }
                      className="mr-2"
                    />
                    Female
                  </label>
                </div>
              </div>
            </div>
          </Dialog.Panel>
          <Dialog.Footer>
            <>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSavePatient}>Save Patient</Button>
            </>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
