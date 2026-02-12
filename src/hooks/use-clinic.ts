// Hook to fetch and provide clinic data

import { useState, useEffect } from 'react';
import { clinicService } from '../api/clinic.api';
import type { Clinic } from '../types';

export function useClinic() {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClinic = async () => {
      try {
        setLoading(true);
        setError(null);
        const clinicData = await clinicService.getCurrentClinic();
        if (clinicData) {
          setClinic(clinicData);
        } else {
          setError('Failed to load clinic data');
          // Set fallback clinic data
        }
      } catch (err) {
        console.error('Error loading clinic:', err);
        setError('Failed to load clinic data');
        // Set fallback clinic data
      } finally {
        setLoading(false);
      }
    };

    loadClinic();
  }, []);

  return { clinic, loading, error };
}
