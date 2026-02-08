import dayjs from 'dayjs';
import type { AvailableSlot } from '@/types/api';

/** Convert YYYY-MM-DD to DD-MM-YYYY for API calls */
export const toApiDateFormat = (isoDate: string): string => {
  return dayjs(isoDate).format('DD-MM-YYYY');
};

/** Convert DD-MM-YYYY to YYYY-MM-DD for frontend */
export const fromApiDateFormat = (apiDate: string): string => {
  return dayjs(apiDate, 'DD-MM-YYYY').format('YYYY-MM-DD');
};

/** Format "09:00:00" to "09:00" */
export const formatTimeShort = (time: string): string => {
  return time.slice(0, 5);
};

/** Group slots into morning/afternoon/evening */
export const groupSlotsByPeriod = (slots: AvailableSlot[]) => {
  const morning: AvailableSlot[] = [];
  const afternoon: AvailableSlot[] = [];
  const evening: AvailableSlot[] = [];

  for (const slot of slots) {
    const hour = parseInt(slot.start_time.slice(0, 2), 10);
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 16) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  }

  return { morning, afternoon, evening };
};

/** Get a 14-day date range starting from today */
export const getSlotDateRange = () => {
  const start = dayjs().format('YYYY-MM-DD');
  const end = dayjs().add(14, 'day').format('YYYY-MM-DD');
  return { start, end };
};
