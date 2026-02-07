import { cn } from '@/lib/utils';
import * as React from 'react';

export interface StepperStep {
  label: string;
  description?: string;
  completed?: boolean;
  active?: boolean;
}

export interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

const Stepper = React.forwardRef<HTMLDivElement, StepperProps>(
  ({ steps, currentStep, className }, ref) => {
    return (
      <div ref={ref} className={cn('w-full', className)}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors',
                        isCompleted
                          ? 'bg-teal-600 border-teal-600 text-white'
                          : isActive
                            ? 'bg-teal-50 border-teal-600 text-teal-600'
                            : 'bg-white border-gray-300 text-gray-400',
                      )}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <span className="text-xs font-semibold">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Step Label */}
                  <div className="mt-1.5 text-center">
                    <div
                      className={cn(
                        'text-xs font-medium',
                        isActive
                          ? 'text-teal-600'
                          : isCompleted
                            ? 'text-gray-900'
                            : 'text-gray-500',
                      )}
                    >
                      {step.label}
                    </div>
                    {step.description && (
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>
                {/* Connector Line */}
                {!isLast && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-1.5 transition-colors',
                      index < currentStep ? 'bg-teal-600' : 'bg-gray-300',
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  },
);
Stepper.displayName = 'Stepper';

export { Stepper };
