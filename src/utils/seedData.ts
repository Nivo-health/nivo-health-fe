// Seed dummy data for development/demo purposes

export function seedDummyData(force: boolean = false) {
  const PATIENTS_KEY = 'clinic_patients';
  const VISITS_KEY = 'clinic_visits';

  try {
    // Check if data already exists (unless force is true)
    if (!force) {
      const existingPatients = localStorage.getItem(PATIENTS_KEY);
      if (existingPatients) {
        try {
          const parsed = JSON.parse(existingPatients);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('Patient data already exists, skipping seed');
            return; // Don't seed if data already exists
          }
        } catch (e) {
          // If parsing fails, clear it and seed
          console.log('Invalid patient data found, clearing and reseeding');
          localStorage.removeItem(PATIENTS_KEY);
          localStorage.removeItem(VISITS_KEY);
        }
      }
    } else {
      // Force mode - clear existing data
      localStorage.removeItem(PATIENTS_KEY);
      localStorage.removeItem(VISITS_KEY);
      console.log('Force seeding - cleared existing data');
    }

  // Create dummy patients
  const dummyPatients = [
    {
      id: 'patient_1',
      name: 'Ramesh Patil',
      mobile: '9898765412',
      age: 45,
      gender: 'M' as const,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    },
    {
      id: 'patient_2',
      name: 'Priya Sharma',
      mobile: '9876543210',
      age: 32,
      gender: 'F' as const,
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
    },
    {
      id: 'patient_3',
      name: 'Amit Kumar',
      mobile: '9765432109',
      age: 28,
      gender: 'M' as const,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    },
    {
      id: 'patient_4',
      name: 'Sunita Devi',
      mobile: '9654321098',
      age: 55,
      gender: 'F' as const,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    },
  ];

  // Create dummy visits
  const now = new Date();
  const dummyVisits = [
    // Patient 1 - Ramesh Patil (2 visits)
    {
      id: 'visit_1',
      patientId: 'patient_1',
      date: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      status: 'completed' as const,
      notes: 'Patient complains of persistent headache and fatigue. Blood pressure normal.',
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
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'active' as const,
      notes: 'Follow-up visit. Headache improved. Patient feels better.',
      prescription: null,
    },
    // Patient 2 - Priya Sharma (1 completed visit)
    {
      id: 'visit_3',
      patientId: 'patient_2',
      date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      status: 'completed' as const,
      notes: 'Routine checkup. Patient reports mild cough and cold symptoms.',
      prescription: {
        medicines: [
          {
            id: 'med_3',
            name: 'Cetirizine',
            dosage: '10mg',
            duration: '3 days',
            notes: 'Before sleep',
          },
          {
            id: 'med_4',
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
    // Patient 3 - Amit Kumar (1 active visit)
    {
      id: 'visit_4',
      patientId: 'patient_3',
      date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      status: 'active' as const,
      notes: 'New patient. Complains of back pain after gym workout.',
      prescription: null,
    },
    // Patient 4 - Sunita Devi (1 completed visit)
    {
      id: 'visit_5',
      patientId: 'patient_4',
      date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      status: 'completed' as const,
      notes: 'Diabetes checkup. Blood sugar levels stable. Continue current medication.',
      prescription: {
        medicines: [
          {
            id: 'med_5',
            name: 'Metformin',
            dosage: '500mg',
            duration: '30 days',
            notes: 'Twice daily with meals',
          },
          {
            id: 'med_6',
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
  ];

    // Save to localStorage
    localStorage.setItem(PATIENTS_KEY, JSON.stringify(dummyPatients));
    localStorage.setItem(VISITS_KEY, JSON.stringify(dummyVisits));
    console.log('Dummy data seeded successfully:', {
      patients: dummyPatients.length,
      visits: dummyVisits.length,
    });
  } catch (error) {
    console.error('Error seeding dummy data:', error);
  }
}
