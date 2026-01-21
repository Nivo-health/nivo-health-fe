// Seed dummy data for development/demo purposes

export function seedDummyData(force: boolean = false) {
  const PATIENTS_KEY = 'clinic_patients';
  const VISITS_KEY = 'clinic_visits';

  try {
    // Check if data already exists (unless force is true)
    let shouldSeedPatients = false;
    let shouldSeedVisits = false;

    if (!force) {
      // Check patients
      const existingPatients = localStorage.getItem(PATIENTS_KEY);
      if (!existingPatients) {
        shouldSeedPatients = true;
      } else {
        try {
          const parsed = JSON.parse(existingPatients);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            shouldSeedPatients = true;
          }
        } catch (e) {
          // If parsing fails, clear it and seed
          console.log('Invalid patient data found, will reseed');
          localStorage.removeItem(PATIENTS_KEY);
          shouldSeedPatients = true;
        }
      }

      // Check visits separately
      const existingVisits = localStorage.getItem(VISITS_KEY);
      if (!existingVisits) {
        shouldSeedVisits = true;
      } else {
        try {
          const parsed = JSON.parse(existingVisits);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            shouldSeedVisits = true;
          }
        } catch (e) {
          // If parsing fails, clear it and seed
          console.log('Invalid visit data found, will reseed');
          localStorage.removeItem(VISITS_KEY);
          shouldSeedVisits = true;
        }
      }

      // If both exist, skip seeding
      if (!shouldSeedPatients && !shouldSeedVisits) {
        console.log('Patient and visit data already exist, skipping seed');
        return;
      }
    } else {
      // Force mode - clear existing data
      localStorage.removeItem(PATIENTS_KEY);
      localStorage.removeItem(VISITS_KEY);
      console.log('Force seeding - cleared existing data');
      shouldSeedPatients = true;
      shouldSeedVisits = true;
    }

  // Create dummy patients
  const dummyPatients = [
    {
      id: 'patient_1',
      name: 'Ramesh Patil',
      mobile: '9898765412',
      age: 45,
      gender: 'M' as const,
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days ago
    },
    {
      id: 'patient_2',
      name: 'Priya Sharma',
      mobile: '9876543210',
      age: 32,
      gender: 'F' as const,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days ago
    },
    {
      id: 'patient_3',
      name: 'Amit Kumar',
      mobile: '9765432109',
      age: 28,
      gender: 'M' as const,
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
    },
    {
      id: 'patient_4',
      name: 'Sunita Devi',
      mobile: '9654321098',
      age: 55,
      gender: 'F' as const,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      id: 'patient_5',
      name: 'Rajesh Singh',
      mobile: '9543210987',
      age: 38,
      gender: 'M' as const,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
    },
    {
      id: 'patient_6',
      name: 'Kavita Reddy',
      mobile: '9432109876',
      age: 29,
      gender: 'F' as const,
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    },
  ];

  // Create dummy visits
  const now = new Date();
  const dummyVisits = [
    // Patient 1 - Ramesh Patil (4 visits - good history)
    {
      id: 'visit_1',
      patientId: 'patient_1',
      date: new Date(now.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString(), // 75 days ago
      status: 'completed' as const,
      notes: 'Initial consultation. Patient complains of persistent headache and fatigue. Blood pressure normal.',
      prescription: {
        medicines: [
          {
            id: 'med_1',
            name: 'Paracetamol',
            dosage: '500mg',
            duration: '5 days',
            notes: 'After meals',
          },
          {
            id: 'med_2',
            name: 'Multivitamin',
            dosage: '1-0-1',
            duration: '15 days',
            notes: '',
          },
        ],
        followUp: {
          value: 7,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_2',
      patientId: 'patient_1',
      date: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(), // 50 days ago
      status: 'completed' as const,
      notes: 'Follow-up visit. Headache improved significantly. Patient feels better. Continue medication.',
      prescription: {
        medicines: [
          {
            id: 'med_3',
            name: 'Paracetamol',
            dosage: '500mg',
            duration: '3 days',
            notes: 'As needed',
          },
        ],
        followUp: {
          value: 14,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_3',
      patientId: 'patient_1',
      date: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days ago
      status: 'completed' as const,
      notes: 'Routine checkup. Patient reports no headaches. General health good.',
      prescription: {
        medicines: [
          {
            id: 'med_4',
            name: 'Multivitamin',
            dosage: '1-0-0',
            duration: '30 days',
            notes: 'Once daily',
          },
        ],
        followUp: {
          value: 30,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_4',
      patientId: 'patient_1',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'waiting' as const,
      notes: 'Follow-up visit scheduled. Patient feels well.',
      prescription: null,
    },
    // Patient 2 - Priya Sharma (3 visits)
    {
      id: 'visit_5',
      patientId: 'patient_2',
      date: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago
      status: 'completed' as const,
      notes: 'First visit. Patient reports mild cough and cold symptoms. No fever.',
      prescription: {
        medicines: [
          {
            id: 'med_5',
            name: 'Cetirizine',
            dosage: '10mg',
            duration: '3 days',
            notes: 'Before sleep',
          },
          {
            id: 'med_6',
            name: 'Cough Syrup',
            dosage: '10ml',
            duration: '5 days',
            notes: 'Three times a day',
          },
        ],
        followUp: {
          value: 5,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_6',
      patientId: 'patient_2',
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      status: 'completed' as const,
      notes: 'Follow-up. Cough resolved. Patient feeling better. No further medication needed.',
      prescription: null,
      followUp: null,
    },
    {
      id: 'visit_7',
      patientId: 'patient_2',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      status: 'completed' as const,
      notes: 'Routine checkup. Patient reports seasonal allergies. Prescribed antihistamine.',
      prescription: {
        medicines: [
          {
            id: 'med_7',
            name: 'Loratadine',
            dosage: '10mg',
            duration: '7 days',
            notes: 'Once daily',
          },
        ],
        followUp: {
          value: 7,
          unit: 'days' as const,
        },
      },
    },
    // Patient 3 - Amit Kumar (2 visits)
    {
      id: 'visit_8',
      patientId: 'patient_3',
      date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      status: 'completed' as const,
      notes: 'New patient. Complains of back pain after gym workout. Advised rest and pain relief.',
      prescription: {
        medicines: [
          {
            id: 'med_8',
            name: 'Ibuprofen',
            dosage: '400mg',
            duration: '5 days',
            notes: 'After meals, twice daily',
          },
          {
            id: 'med_9',
            name: 'Muscle Relaxant',
            dosage: '1-0-1',
            duration: '3 days',
            notes: '',
          },
        ],
        followUp: {
          value: 7,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_9',
      patientId: 'patient_3',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'waiting' as const,
      notes: 'Follow-up for back pain. Patient reports improvement.',
      prescription: null,
    },
    // Patient 4 - Sunita Devi (3 visits)
    {
      id: 'visit_10',
      patientId: 'patient_4',
      date: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days ago
      status: 'completed' as const,
      notes: 'Diabetes checkup. Blood sugar levels stable. Continue current medication.',
      prescription: {
        medicines: [
          {
            id: 'med_10',
            name: 'Metformin',
            dosage: '500mg',
            duration: '30 days',
            notes: 'Twice daily with meals',
          },
          {
            id: 'med_11',
            name: 'Vitamin D',
            dosage: '1000 IU',
            duration: '30 days',
            notes: 'Once daily',
          },
        ],
        followUp: {
          value: 30,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_11',
      patientId: 'patient_4',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'completed' as const,
      notes: 'Follow-up visit. Blood sugar well controlled. Continue medication as prescribed.',
      prescription: {
        medicines: [
          {
            id: 'med_12',
            name: 'Metformin',
            dosage: '500mg',
            duration: '30 days',
            notes: 'Twice daily with meals',
          },
        ],
        followUp: {
          value: 30,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_12',
      patientId: 'patient_4',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'in_progress' as const,
      notes: 'Routine diabetes monitoring. Blood work pending.',
      prescription: null,
    },
    // Patient 5 - Rajesh Singh (2 visits)
    {
      id: 'visit_13',
      patientId: 'patient_5',
      date: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      status: 'completed' as const,
      notes: 'New patient. Complains of stomach pain and indigestion. Prescribed antacid.',
      prescription: {
        medicines: [
          {
            id: 'med_13',
            name: 'Antacid',
            dosage: '10ml',
            duration: '7 days',
            notes: 'After meals, three times a day',
          },
          {
            id: 'med_14',
            name: 'Omeprazole',
            dosage: '20mg',
            duration: '14 days',
            notes: 'Once daily before breakfast',
          },
        ],
        followUp: {
          value: 14,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_14',
      patientId: 'patient_5',
      date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      status: 'waiting' as const,
      notes: 'Follow-up visit. Patient reports improvement in symptoms.',
      prescription: null,
    },
    // Patient 6 - Kavita Reddy (2 visits)
    {
      id: 'visit_15',
      patientId: 'patient_6',
      date: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
      status: 'completed' as const,
      notes: 'New patient. Routine health checkup. All vitals normal.',
      prescription: {
        medicines: [
          {
            id: 'med_15',
            name: 'Iron Supplement',
            dosage: '100mg',
            duration: '30 days',
            notes: 'Once daily with food',
          },
        ],
        followUp: {
          value: 30,
          unit: 'days' as const,
        },
      },
    },
    {
      id: 'visit_16',
      patientId: 'patient_6',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'waiting' as const,
      notes: 'Follow-up visit for routine checkup.',
      prescription: null,
    },
  ];

    // Save to localStorage
    if (shouldSeedPatients) {
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(dummyPatients));
      console.log('Seeded patients:', dummyPatients.length);
    }
    if (shouldSeedVisits) {
      localStorage.setItem(VISITS_KEY, JSON.stringify(dummyVisits));
      console.log('Seeded visits:', dummyVisits.length);
    }
    console.log('Dummy data seeding completed:', {
      patients: shouldSeedPatients ? dummyPatients.length : 'skipped (already exists)',
      visits: shouldSeedVisits ? dummyVisits.length : 'skipped (already exists)',
    });
  } catch (error) {
    console.error('Error seeding dummy data:', error);
  }
}
