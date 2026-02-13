// Hook to fetch and provide clinic data

import { useCurrentClinic } from '@/queries/clinic.queries';

export function useClinic() {
  return useCurrentClinic();
}
