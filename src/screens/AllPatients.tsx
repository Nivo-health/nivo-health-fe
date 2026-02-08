import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllPatients, useCreatePatient } from '../queries/patients.queries';
import { useFiltersStore } from '../stores/filters.store';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

export default function AllPatientsScreen() {
  const navigate = useNavigate();
  const { data: patients = [], isLoading } = useAllPatients();
  const createPatientMutation = useCreatePatient();
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

  const filteredPatients = useMemo(() => {
    let filtered = [...patients];
    if (patientSearch.trim() !== '') {
      const query = patientSearch.toLowerCase();
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(query) ||
          patient.mobile.includes(patientSearch),
      );
    }
    return filtered;
  }, [patients, patientSearch]);

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
    if (!newPatient.gender) {
      newErrors.gender = 'Gender is required';
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
      console.log('🔄 Creating patient...');
      const patient = await createPatientMutation.mutateAsync({
        name: newPatient.name.trim(),
        mobile: newPatient.mobile.trim(),
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender as 'M' | 'F', // Gender is required, validated in form
      });

      console.log('✅ Patient created:', patient);

      // Show success message
      toast.add({
        title: 'Patient created successfully!',
        type: 'success',
      });

      // Close modal
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('❌ Failed to create patient:', error);

      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));
        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      } else {
        toast.add({
          title: getErrorMessage(error),
          type: 'error',
        });
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading patients...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl md:text-3xl font-bold text-teal-900">
                All Patients
              </h1>
              <p className="text-xs md:text-base text-gray-600 mt-1">
                {filteredPatients.length}{' '}
                {filteredPatients.length === 1 ? 'patient' : 'patients'}
                {patientSearch && ` found`}
              </p>
            </div>
            <Button
              onClick={handleAddNewPatient}
              className="shrink-0 text-sm md:text-base px-3 md:px-4"
              size="sm"
            >
              + Add
            </Button>
          </div>
        </div>

        {/* Search - Compact on Mobile */}
        <div className="mb-4 md:mb-6">
          <Input
            type="text"
            placeholder="Search by name or mobile..."
            value={patientSearch}
            onChange={(e) => setPatientSearch(e.target.value)}
            className="w-full text-sm md:text-base"
          />
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid gap-3">
            {filteredPatients.map((patient) => (
              <Card.Root
                key={patient.id}
                className="border-teal-200 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <Card.Panel className="p-3 md:p-5">
                  {/* Mobile View - Compact Layout */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0">
                        {patient.name.charAt(0).toUpperCase()}
                      </div>

                      {/* Patient Info - 2 Column Grid */}
                      <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {/* Name - Full Width */}
                        <div className="col-span-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {patient.name}
                          </h3>
                        </div>

                        {/* Mobile Number */}
                        <div className="min-w-0">
                          {patient.mobile ? (
                            <span className="text-xs text-gray-600 whitespace-nowrap block truncate">
                              📱 {patient.mobile}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">📱 —</span>
                          )}
                        </div>

                        {/* Age */}
                        <div className="min-w-0">
                          <span className="text-xs text-gray-600 whitespace-nowrap block">
                            👤{' '}
                            {patient.age !== undefined && patient.age !== null
                              ? `${patient.age} yrs`
                              : 'N/A'}
                          </span>
                        </div>

                        {/* Gender */}
                        <div className="col-span-2">
                          {patient.gender ? (
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {patient.gender === 'M' ? '♂' : '♀'}{' '}
                              {patient.gender === 'M' ? 'Male' : 'Female'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desktop View - Column Layout */}
                  <div className="hidden md:flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {patient.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Column-based layout for desktop */}
                    <div className="flex-1 min-w-0 grid grid-cols-[minmax(150px,1fr)_minmax(120px,auto)_minmax(80px,auto)_minmax(100px,auto)] gap-4 items-center">
                      {/* Name Column */}
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {patient.name}
                        </h3>
                      </div>

                      {/* Mobile Column */}
                      <div className="min-w-0">
                        {patient.mobile ? (
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            📱 {patient.mobile || 'N/A'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>

                      {/* Age Column */}
                      <div className="min-w-0">
                        <span className="text-sm text-gray-600 whitespace-nowrap">
                          👤{' '}
                          {patient.age !== undefined && patient.age !== null
                            ? patient.age
                            : 'N/A'}
                        </span>
                      </div>

                      {/* Gender Column */}
                      <div className="min-w-0">
                        {patient.gender ? (
                          <span className="text-sm text-gray-600 whitespace-nowrap">
                            {patient.gender === 'M' ? '♂' : '♀'}{' '}
                            {patient.gender === 'M' ? 'Male' : 'Female'}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card.Panel>
              </Card.Root>
            ))}
          </div>
        ) : (
          <Card.Root className="border-teal-200">
            <Card.Panel className="p-12 text-center">
              <div className="text-gray-500">
                {patientSearch ? (
                  <>
                    <p className="text-lg font-medium mb-2">
                      No patients found
                    </p>
                    <p className="text-sm">
                      Try a different search term or{' '}
                      <button
                        onClick={() => navigate('/visits')}
                        className="text-teal-600 hover:text-teal-700 underline"
                      >
                        add a new patient
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">No patients yet</p>
                    <p className="text-sm mb-4">
                      Get started by adding your first patient
                    </p>
                    <Button onClick={() => navigate('/visits')}>
                      + Add New Patient
                    </Button>
                  </>
                )}
              </div>
            </Card.Panel>
          </Card.Root>
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
                  Gender *
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
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
                )}
              </div>
            </div>
          </Dialog.Panel>

          <Dialog.Footer>
            <>
              <Dialog.Close
                render={
                  <Button
                    variant="outline"
                    onClick={() => setIsModalOpen(false)}
                  />
                }
              >
                Cancel
              </Dialog.Close>

              <Button onClick={handleSavePatient}>Save Patient</Button>
            </>
          </Dialog.Footer>
        </Dialog.Popup>
      </Dialog.Root>
    </div>
  );
}
