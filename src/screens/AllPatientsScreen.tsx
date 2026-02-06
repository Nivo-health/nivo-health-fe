import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Modal } from '../components/ui';
import { Card, CardContent } from '../components/ui/Card';
import { patientService } from '../services/patientService';
import { toast } from '../utils/toast';
import type { Patient } from '../types';
import {
  validatePhoneNumber,
  formatPhoneInput,
} from '../utils/phoneValidation';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '../utils/errorHandler';

export default function AllPatientsScreen() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadPatients();
  }, []);

  useEffect(() => {
    const filterPatients = () => {
      let filtered = [...patients];

      // Apply search filter only
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (patient) =>
            patient.name.toLowerCase().includes(query) ||
            patient.mobile.includes(searchQuery),
        );
      }

      setFilteredPatients(filtered);
    };

    filterPatients();
  }, [searchQuery, patients]);

  const loadPatients = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading patients...');
      const allPatients = await patientService.getAll();
      console.log('📊 Patients loaded:', {
        count: allPatients.length,
        patients: allPatients,
        firstPatient: allPatients[0]
          ? {
              id: allPatients[0].id,
              name: allPatients[0].name,
              keys: Object.keys(allPatients[0]),
              mobile: allPatients[0].mobile,
              phone: (allPatients[0] as any).phone,
              mobileNumber: (allPatients[0] as any).mobileNumber,
            }
          : null,
      });
      setPatients(allPatients);
      setFilteredPatients(allPatients);
      console.log(
        '✅ State updated - patients:',
        allPatients.length,
        'filtered:',
        allPatients.length,
      );
    } catch (error) {
      console.error('❌ Failed to load patients:', error);
    } finally {
      setLoading(false);
      console.log('🏁 Loading complete');
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
      const patient = await patientService.create({
        name: newPatient.name.trim(),
        mobile: newPatient.mobile.trim(),
        age: newPatient.age ? Number(newPatient.age) : undefined,
        gender: newPatient.gender as 'M' | 'F', // Gender is required, validated in form
      });

      console.log('✅ Patient created:', patient);

      // Show success message
      toast.success('Patient created successfully!');

      // Close modal
      setIsModalOpen(false);

      // Reload patients list to show the new patient
      await loadPatients();
    } catch (error: any) {
      console.error('❌ Failed to create patient:', error);

      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));
        toast.error(getErrorMessage(error));
      } else {
        toast.error(getErrorMessage(error));
      }
    }
  };

  if (loading) {
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
                {searchQuery && ` found`}
              </p>
            </div>
            <Button
              onClick={handleAddNewPatient}
              className="flex-shrink-0 text-sm md:text-base px-3 md:px-4"
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm md:text-base"
          />
        </div>

        {filteredPatients.length > 0 ? (
          <div className="grid gap-3">
            {filteredPatients.map((patient) => (
              <Card
                key={patient.id}
                className="border-teal-200 hover:border-teal-400 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <CardContent className="p-3 md:p-5">
                  {/* Mobile View - Compact Layout */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-base flex-shrink-0">
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
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
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
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-teal-200">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                {searchQuery ? (
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
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Add New Patient"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePatient}>Save Patient</Button>
          </>
        }
      >
        <div className="space-y-5">
          <Input
            label="Name *"
            value={newPatient.name}
            onChange={(e) =>
              setNewPatient({ ...newPatient, name: e.target.value })
            }
            error={errors.name}
            placeholder="Enter patient name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
          <Input
            label="Mobile *"
            type="tel"
            value={newPatient.mobile}
            onChange={(e) =>
              setNewPatient({
                ...newPatient,
                mobile: formatPhoneInput(e.target.value),
              })
            }
            error={errors.mobile}
            placeholder="Enter mobile number (e.g., +91 9876543210)"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
          <Input
            label="Age"
            type="number"
            value={newPatient.age}
            onChange={(e) =>
              setNewPatient({ ...newPatient, age: e.target.value })
            }
            error={errors.age}
            placeholder="Enter age (optional)"
            min="0"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSavePatient();
              }
            }}
          />
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
      </Modal>
    </div>
  );
}
