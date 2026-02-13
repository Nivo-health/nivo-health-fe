import { get } from './client';

export interface Medication {
  id: string;
  name: string;
  full_name: string;
  generic_name: string | null;
  manufacturer: string;
  created_at?: string;
  updated_at?: string;
}

export const medicationService = {
  /**
   * Search medications by query
   * GET /api/medications?query={query}
   * Returns up to 10 results
   */
  async search(query: string): Promise<Medication[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await get<Medication[]>('/medications', {
        query: query.trim(),
      });

      if (!response.success || !response.data) {
        return [];
      }

      // Ensure we have an array and limit to 10 results
      const medications = Array.isArray(response.data) ? response.data : [];
      return medications.slice(0, 10);
    } catch (error: any) {
      return [];
    }
  },
};
