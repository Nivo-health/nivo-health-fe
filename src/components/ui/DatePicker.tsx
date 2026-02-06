import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '../../utils/cn';

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    { value, onChange, placeholder = 'Select date', className, ...props },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(() => {
      if (value) {
        const date = new Date(value);
        return isNaN(date.getTime()) ? null : date;
      }
      return null;
    });

    React.useEffect(() => {
      if (value) {
        const date = new Date(value);
        setSelectedDate(isNaN(date.getTime()) ? null : date);
      } else {
        setSelectedDate(null);
      }
    }, [value]);

    const formatDate = (date: Date | null): string => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const displayDate = (date: Date | null): string => {
      if (!date) return placeholder;
      return formatDate(date);
    };

    const handleDateSelect = (date: Date) => {
      setSelectedDate(date);
      const formatted = formatDate(date);
      onChange?.(formatted);
      setOpen(false);
    };

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const selectedYear = selectedDate?.getFullYear() || currentYear;
    const selectedMonth = selectedDate?.getMonth() || currentMonth;

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const navigateMonth = (direction: 'prev' | 'next') => {
      const newDate = new Date(
        selectedYear,
        selectedMonth + (direction === 'next' ? 1 : -1),
        1,
      );
      setSelectedDate(newDate);
    };

    const isToday = (day: number) => {
      const date = new Date(selectedYear, selectedMonth, day);
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    const isSelected = (day: number) => {
      if (!selectedDate) return false;
      return (
        day === selectedDate.getDate() &&
        selectedMonth === selectedDate.getMonth() &&
        selectedYear === selectedDate.getFullYear()
      );
    };

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            ref={ref}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-teal-300 bg-white px-3 py-2 text-sm',
              'ring-offset-white placeholder:text-gray-400',
              'focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className,
            )}
            {...props}
          >
            <span className={!selectedDate ? 'text-gray-400' : ''}>
              {displayDate(selectedDate)}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 opacity-50"
            >
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <line x1="16" x2="16" y1="2" y2="6" />
              <line x1="8" x2="8" y1="2" y2="6" />
              <line x1="3" x2="21" y1="10" y2="10" />
            </svg>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className={cn(
              'z-50 w-70 rounded-md border border-teal-200 bg-white p-4 shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
              'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
              'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            )}
            align="start"
            sideOffset={4}
          >
            <div className="space-y-4">
              {/* Month/Year Navigation */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => navigateMonth('prev')}
                  className="rounded-md p-1 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
                <div className="font-semibold text-gray-900">
                  {monthNames[selectedMonth]} {selectedYear}
                </div>
                <button
                  type="button"
                  onClick={() => navigateMonth('next')}
                  className="rounded-md p-1 hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500">
                  {weekDays.map((day) => (
                    <div key={day} className="py-1">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-8" />
                  ))}

                  {/* Days of the month */}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(
                    (day) => {
                      const isDayToday = isToday(day);
                      const isDaySelected = isSelected(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() =>
                            handleDateSelect(
                              new Date(selectedYear, selectedMonth, day),
                            )
                          }
                          className={cn(
                            'h-8 rounded-md text-sm transition-colors',
                            'hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-teal-500',
                            isDaySelected
                              ? 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-500'
                              : 'text-gray-900',
                            isDayToday &&
                              !isDaySelected &&
                              'font-semibold text-teal-600',
                          )}
                        >
                          {day}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {/* Today button */}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDateSelect(today)}
                  className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Today
                </button>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
