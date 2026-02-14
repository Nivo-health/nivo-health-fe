import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTable } from '@/components/ui/table-ui';
import { toast } from '@/components/ui/toast';
import CreateVisitModal from '@/components/visits/modals/create-visit-modal';
import { VISIT_STATUS } from '@/constants/api';
import { useFilters } from '@/hooks';
import { useModal } from '@/hooks/use-modal';
import { cn } from '@/lib/utils';
import { useCurrentClinic } from '@/queries/clinic.queries';
import {
  useCreatePatient,
  usePatientSearchLazy,
} from '@/queries/patients.queries';
import { useCreateVisit, useVisitsList } from '@/queries/visits.queries';
import type { Patient, Visit } from '@/types/api';
import {
  extractValidationErrors,
  getErrorMessage,
  hasValidationErrors,
} from '@/utils/error-handler';
import {
  formatPhoneForAPI,
  validatePhoneNumber,
} from '@/utils/phone-validation';
import { ColumnDef } from '@tanstack/react-table';
import ClipboardList from 'lucide-react/dist/esm/icons/clipboard-list';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const STATUS_LABEL = {
  WAITING: 'Waiting',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

const STATUS_FILTER = [
  {
    lable: 'All Statuses',
    value: 'ALL',
  },

  {
    lable: 'Waiting',
    value: 'WAITING',
  },
  {
    lable: 'In Progress',
    value: 'IN_PROGRESS',
  },
  {
    lable: 'Completed',
    value: 'COMPLETED',
  },
  {
    lable: 'Cancelled',
    value: 'CANCELLED',
  },
];

const Lable = ({ status }: { status: keyof typeof VISIT_STATUS }) => {
  return (
    <span
      className={cn(`px-2 py-1 rounded-full text-xs font-normal text-white`, {
        'bg-yellow-500': status === VISIT_STATUS.WAITING,
        'bg-primary': status === VISIT_STATUS.IN_PROGRESS,
        'bg-red-800': status === VISIT_STATUS.COMPLETED,
      })}
    >
      {STATUS_LABEL[status]}
    </span>
  );
};

export const appointmentColumns: ColumnDef<Visit>[] = [
  {
    accessorKey: 'token_number',
    header: () => <div className="text-center">Token</div>,
    size: 30,
    cell: ({ getValue }) => (
      <div className="flex items-center justify-center w-ful">
        <span className="text-xs truncate capitalize px-2 py-1 rounded-md bg-primary/70 text-white">
          {getValue<string>() || '-'}
        </span>
      </div>
    ),
  },
  {
    accessorKey: 'patient.name',
    header: 'Name',
    size: 300,
    cell: ({ getValue }) => (
      <span className="text-xs block truncate capitalize">
        {getValue<string>() || '-'}
      </span>
    ),
  },
  {
    accessorKey: 'patient.mobile',
    header: 'Mobile',
    size: 100,
    cell: ({ getValue }) => (
      <span className="text-xs block truncate">
        {getValue<string>() || '-'}
      </span>
    ),
  },

  {
    accessorKey: 'visit_status',
    header: 'Status',
    size: 80,
    cell: ({ row: { original } }) => {
      const { visit_status } = original;
      return <Lable status={visit_status!} />;
    },
  },
];

type FilterValues = {
  SEARCH: string;
  DATE: string;
  DOCTOR_ID: string;
  PAGE: number;
  VISIT_STATUS: keyof typeof VISIT_STATUS | 'ALL';
  PAGE_SIZE: number;
};

export default function VisitsScreen() {
  const navigate = useNavigate();
  const { values, updateFilter, updateMultipleFilters } =
    useFilters<FilterValues>({
      initialValue: {
        SEARCH: '',
        DATE: '',
        DOCTOR_ID: 'ALL',
        PAGE: 1,
        VISIT_STATUS: VISIT_STATUS.WAITING,
        PAGE_SIZE: 20,
      },
      useQueryParams: true,
    });

  const createVisitModal = useModal();

  const [step, setStep] = useState<'mobile' | 'patient-form'>('mobile');
  const [mobileNumber, setMobileNumber] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const [newPatient, setNewPatient] = useState({
    name: '',
    mobile: '',
    age: '',
    gender: '' as 'M' | 'F' | '',
  });
  const [visitReason, setVisitReason] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [doctorError, setDoctorError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clinic } = useCurrentClinic();
  const clinicDoctors = clinic?.doctors || [];
  const createPatientMutation = useCreatePatient();
  const createVisitMutation = useCreateVisit();
  const patientSearchMutation = usePatientSearchLazy();
  const searching = patientSearchMutation.isPending;

  const doctorId =
    values.DOCTOR_ID && values.DOCTOR_ID !== 'ALL'
      ? values.DOCTOR_ID
      : undefined;
  const { data: visitsResult, isLoading: loading } = useVisitsList({
    page: values.PAGE,
    pageSize: values.PAGE_SIZE,
    date: values.DATE,
    visitStatus:
      values.VISIT_STATUS === 'ALL' ? undefined : values.VISIT_STATUS,
    doctorId,
  });

  const visits = visitsResult?.visits || [];
  const totalCount = visitsResult?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / values.PAGE_SIZE));
  const filteredVisits = useMemo(() => {
    if (!values.SEARCH.trim()) return visits;
    const query = values.SEARCH.toLowerCase();
    return visits.filter((visit) => {
      const patient = visit.patient;
      if (!patient) return false;
      const nameMatch = patient.name?.toLowerCase().includes(query);
      const mobileMatch = patient.mobile?.includes(query);
      const reasonMatch = visit.visit_reason?.toLowerCase().includes(query);
      return nameMatch || mobileMatch || reasonMatch;
    });
  }, [values.SEARCH, visits]);

  const handleCreateVisit = () => {
    createVisitModal.open();
    setStep('mobile');
    setMobileNumber('');
    setFoundPatient(null);
    setNewPatient({ name: '', mobile: '', age: '', gender: '' });
    setVisitReason('');
    setErrors({});
    setDoctorError('');
    // Auto-select doctor if only one is available
    if (clinicDoctors.length === 1) {
      setSelectedDoctorId(clinicDoctors[0].id);
    } else if (clinicDoctors.length > 1) {
      setSelectedDoctorId(''); // Reset to allow user to choose
    }
  };

  const handleVisitClick = (visit: Visit) => {
    navigate(`/visit/${visit.id}`);
  };

  const handleSearchPatient = async () => {
    const phoneValidation = validatePhoneNumber(mobileNumber);
    if (!phoneValidation.isValid) {
      setErrors({
        mobile: phoneValidation.error || 'Please enter a valid mobile number',
      });
      return;
    }

    try {
      setErrors({});

      const searchResults = await patientSearchMutation.mutateAsync({
        query: mobileNumber,
        limit: 20,
      });

      if (searchResults.length > 0) {
        // Patient found - use the first match
        const patient = searchResults[0];
        setFoundPatient(patient);
        setNewPatient({
          name: patient.name,
          mobile: patient.mobile,
          age: patient.age?.toString() || '',
          gender: patient.gender || '',
        });
        setStep('patient-form');
      } else {
        // Patient not found - show form to create
        setFoundPatient(null);
        setNewPatient({
          name: '',
          mobile: mobileNumber,
          age: '',
          gender: '',
        });
        setStep('patient-form');
      }
    } catch (error) {
      toast.add({
        type: 'error',
        title: 'Failed to search patient',
      });
    }
  };

  const validatePatientForm = (): boolean => {
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
    if (clinicDoctors.length > 1 && !selectedDoctorId) {
      setDoctorError('Please select a doctor');
    } else {
      setDoctorError('');
    }
    setErrors(newErrors);
    const hasFieldErrors = Object.keys(newErrors).length === 0;
    const hasDoctorError = clinicDoctors.length > 1 ? !selectedDoctorId : false;
    return hasFieldErrors && !hasDoctorError;
  };

  const handleCreateVisitSubmit = async () => {
    if (step === 'mobile') {
      await handleSearchPatient();
      return;
    }

    // Step: patient-form - validate and create visit
    if (!validatePatientForm()) {
      return;
    }

    try {
      let patientId: string;

      if (foundPatient) {
        // Use existing patient
        patientId = foundPatient.id;
      } else {
        // Create new patient
        const patient = await createPatientMutation.mutateAsync({
          name: newPatient.name.trim(),
          mobile: formatPhoneForAPI(newPatient.mobile),
          age: newPatient.age ? Number(newPatient.age) : undefined,
          gender: newPatient.gender as 'M' | 'F',
        });
        patientId = patient.id;
      }

      // Create visit
      const visit = await createVisitMutation.mutateAsync({
        patientId,
        visitReason: visitReason.trim() || 'General consultation',
        status: 'waiting',
        doctorId: selectedDoctorId || undefined,
      });

      toast.add({
        type: 'success',
        title: 'Visit created successfully!',
      });
      createVisitModal.close();

      // Reload visits and navigate
      navigate(`/visit/${visit.id}`);
    } catch (error: any) {
      // Extract validation errors if present
      if (hasValidationErrors(error)) {
        const validationErrors = extractValidationErrors(error);
        setErrors((prevErrors) => ({
          ...prevErrors,
          ...validationErrors,
        }));

        // Also set doctor error if present
        if (validationErrors.doctor || validationErrors.doctor_id) {
          setDoctorError(
            validationErrors.doctor || validationErrors.doctor_id || '',
          );
        }

        // Show general error message
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      } else {
        // Show general error message
        toast.add({
          type: 'error',
          title: getErrorMessage(error),
        });
      }
    }
  };

  const selectedDoc = clinicDoctors.find((doc) => doc.id === values.DOCTOR_ID);

  return (
    <div className="h-screen bg-background overflow-x-hidden md:pb-0 pb-24">
      <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
        {/* Header - Compact on Mobile */}
        <div className="mb-4 md:mb-3">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h6 className="text-sm md:text-sm font-medium text-foreground flex items-center gap-2">
                <ClipboardList className="size-4" /> Queue
              </h6>
            </div>
            <Button onClick={handleCreateVisit} size="sm">
              + Create
            </Button>
          </div>
        </div>

        {/* Filters - Compact on Mobile */}
        <div className="mb-3 flex flex-col sm:flex-row gap-2 md:gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search by name, mobile, or reason..."
              value={values.SEARCH}
              onChange={(e) => updateFilter('SEARCH', e.target.value)}
            />
          </div>
          <div className="sm:w-40 md:w-48">
            <DatePicker
              value={values.DATE}
              onChange={(value) => {
                updateMultipleFilters({
                  DATE: value,
                  PAGE: 1,
                });
              }}
              placeholder="Select date"
              className="w-full text-sm"
            />
          </div>
          {clinicDoctors.length > 0 && (
            <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
              <Select.Root
                value={values.DOCTOR_ID}
                onValueChange={(value) => {
                  updateMultipleFilters({ DOCTOR_ID: value || '', PAGE: 1 });
                }}
              >
                <Select.Trigger className="w-full text-sm">
                  <Select.Value placeholder="All Doctors">
                    {selectedDoc?.name || 'All Doctors'}
                  </Select.Value>
                </Select.Trigger>

                <Select.Popup>
                  <Select.Item value="all">All Doctors</Select.Item>

                  {clinicDoctors.map((doc) => (
                    <Select.Item key={doc.id} value={doc.id}>
                      {doc.name}
                    </Select.Item>
                  ))}
                </Select.Popup>
              </Select.Root>
            </div>
          )}

          {/* Visit Status Filter */}
          <div className="flex flex-col items-start gap-2 sm:w-48 md:w-56">
            <Select.Root
              value={values.VISIT_STATUS || undefined}
              onValueChange={(value) => {
                updateMultipleFilters({
                  VISIT_STATUS: value as keyof typeof VISIT_STATUS,
                  PAGE: 1,
                });
              }}
            >
              <Select.Trigger className="w-full text-sm">
                <Select.Value placeholder="All Statuses">
                  {
                    STATUS_FILTER.find((s) => s.value === values.VISIT_STATUS)
                      ?.lable
                  }
                </Select.Value>
              </Select.Trigger>

              <Select.Popup>
                {STATUS_FILTER.map(({ lable, value }) => (
                  <Select.Item value={value}>{lable}</Select.Item>
                ))}
              </Select.Popup>
            </Select.Root>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="text-xs md:text-sm text-gray-600">
            Page {values.PAGE} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE - 1))}
              disabled={values.PAGE <= 1}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => updateFilter('PAGE', Math.max(1, values.PAGE + 1))}
              disabled={values.PAGE >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
        {loading ? (
          <div className="h-96 bg-background flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {filteredVisits.length > 0 ? (
              <>
                <div className="md:block hidden">
                  <DataTable
                    onRowClick={(_, { original: visit }) =>
                      handleVisitClick(visit)
                    }
                    data={filteredVisits}
                    columns={appointmentColumns}
                  />
                </div>

                <div className="grid gap-3 md:hidden">
                  {filteredVisits.map((visit) => (
                    <Card.Root
                      key={visit.id}
                      className="border-neutral-200 transition-all md:border-0"
                    >
                      <Card.Panel className="p-3">
                        <button
                          type="button"
                          onClick={() => handleVisitClick(visit)}
                          className="w-full text-left"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                              <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[minmax(150px,1fr)_minmax(120px,auto)_minmax(140px,auto)] gap-2 md:gap-4 items-center">
                                <div className="min-w-0 flex">
                                  <h3 className="text-base text-gray-900 truncate flex-1">
                                    {visit.patient?.name || 'Unknown Patient'}
                                  </h3>
                                  <div className="min-w-0">
                                    {visit?.token_number ? (
                                      <span className="truncate capitalize bg-primary text-white px-2 py-1 rounded-full text-xs font-normal">
                                        Token: {visit.token_number}
                                      </span>
                                    ) : (
                                      <span className="text-sm text-muted-foreground">
                                        —
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="min-w-0 flex justify-between">
                                  {visit.patient?.mobile ? (
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                                      Mobile: {visit.patient.mobile}
                                    </span>
                                  ) : (
                                    <span className="text-sm text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                  <Lable status={visit.visit_status!} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </button>
                      </Card.Panel>
                    </Card.Root>
                  ))}
                </div>
              </>
            ) : (
              <Card.Root className="border-teal-200">
                <Card.Panel className="p-12 text-center">
                  <div className="text-gray-500">
                    <p className="text-lg font-medium mb-2">No visits found</p>
                  </div>
                </Card.Panel>
              </Card.Root>
            )}
          </>
        )}
      </div>

      <CreateVisitModal
        open={createVisitModal.isOpen}
        onOpenChange={createVisitModal.toggle}
        step={step}
        onStepChange={setStep}
        mobileNumber={mobileNumber}
        onMobileNumberChange={setMobileNumber}
        foundPatient={foundPatient}
        newPatient={newPatient}
        onNewPatientChange={setNewPatient}
        visitReason={visitReason}
        onVisitReasonChange={setVisitReason}
        clinicDoctors={clinicDoctors}
        selectedDoctorId={selectedDoctorId}
        onSelectedDoctorIdChange={(value) => {
          setSelectedDoctorId(value);
          setDoctorError('');
        }}
        doctorError={doctorError}
        errors={errors}
        onErrorsChange={setErrors}
        onSearchPatient={handleSearchPatient}
        onCreateVisit={handleCreateVisitSubmit}
        searching={searching}
      />
    </div>
  );
}
