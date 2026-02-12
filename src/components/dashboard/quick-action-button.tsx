import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import { ReactNode } from 'react';

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function QuickActionButton({
  icon,
  label,
  onClick,
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-3 h-auto rounded-lg border-border/50 bg-card text-sm font-medium transition-all duration-200 w-full shadow-sm"
    >
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg">
        {icon}
      </div>
      <span className="text-foreground text-start text-sm">{label}</span>
      <ChevronRight
        stroke="currentColor"
        className="size-4 text-muted-foreground"
      />
    </button>
  );
}
