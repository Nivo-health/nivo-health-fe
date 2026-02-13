import * as React from 'react';
import { Popover } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import dayjs, { Dayjs } from 'dayjs';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import { X } from 'lucide-react';
import { Button } from './button';

export interface DatePickerProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  isRemovable?: boolean;
}

const DatePicker = React.forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      isRemovable = true,
      onChange,
      placeholder = 'Select date',
      className,
      ...props
    },
    ref,
  ) => {
    const [open, setOpen] = React.useState(false);
    const [selectedDate, setSelectedDate] = React.useState<Dayjs | null>(() =>
      value && dayjs(value).isValid() ? dayjs(value) : null,
    );

    React.useEffect(() => {
      setSelectedDate(value && dayjs(value).isValid() ? dayjs(value) : null);
    }, [value]);

    const formatDate = (date: Dayjs | null): string =>
      date ? date.format('YYYY-MM-DD') : '';

    const displayDate = (date: Dayjs | null): string =>
      date ? formatDate(date) : placeholder;

    const handleDateSelect = (date: Dayjs) => {
      setSelectedDate(date);
      const formatted = formatDate(date);
      onChange?.(formatted);
      setOpen(false);
    };

    const today = dayjs();
    const currentYear = today.year();
    const currentMonth = today.month();
    const selectedYear = selectedDate?.year() ?? currentYear;
    const selectedMonth = selectedDate?.month() ?? currentMonth;

    const calendarMonth = dayjs()
      .year(selectedYear)
      .month(selectedMonth)
      .date(1);
    const daysInMonth = calendarMonth.daysInMonth();
    const firstDayOfMonth = calendarMonth.day();

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
      const newDate = calendarMonth.add(direction === 'next' ? 1 : -1, 'month');
      setSelectedDate(newDate);
    };

    const isToday = (day: number) => {
      const date = calendarMonth.date(day);
      return date.isSame(today, 'day');
    };

    const isSelected = (day: number) => {
      if (!selectedDate) return false;
      return calendarMonth.date(day).isSame(selectedDate, 'day');
    };

    return (
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger
          render={
            <button
              type="button"
              ref={ref}
              className={cn(
                'flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground',
                'ring-offset-background placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                className,
              )}
              {...props}
            >
              <span className={!selectedDate ? 'text-gray-400' : ''}>
                {displayDate(selectedDate)}
              </span>
              <div className="flex gap-1">
                {value && isRemovable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange?.('');
                    }}
                  >
                    <X className="size-4" />
                  </button>
                )}
                <CalendarDays className="size-4" />
              </div>
            </button>
          }
        />
        <Popover.Popup
          align="start"
          sideOffset={4}
          className={cn(
            'z-50 w-70 rounded-md border border-border bg-popover text-popover-foreground p-4 shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0',
            'data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
            'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          )}
        >
          <div className="space-y-4">
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => navigateMonth('prev')}
                aria-label="Previous month"
                className="rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
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
              <div className="font-semibold text-foreground">
                {monthNames[selectedMonth]} {selectedYear}
              </div>
              <button
                type="button"
                onClick={() => navigateMonth('next')}
                aria-label="Next month"
                className="rounded-md p-1 hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
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
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
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
                          handleDateSelect(calendarMonth.date(day))
                        }
                        className={cn(
                          'h-8 rounded-md text-sm transition-colors',
                          'hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring',
                          isDaySelected
                            ? 'bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-ring'
                            : 'text-foreground',
                          isDayToday &&
                            !isDaySelected &&
                            'font-semibold text-primary',
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
                className="text-xs text-primary hover:underline"
              >
                Today
              </button>
            </div>
          </div>
        </Popover.Popup>
      </Popover.Root>
    );
  },
);
DatePicker.displayName = 'DatePicker';

export { DatePicker };
