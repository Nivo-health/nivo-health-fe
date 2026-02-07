import { ReactNode } from 'react';
import { Card } from '../ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon?: ReactNode;
  loading?: boolean;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  loading = false,
}: StatCardProps) {
  return (
    <Card.Root className="overflow-hidden border-primary/10 ">
      <Card.Header
        className="relative border border-b flex items-center justify-between px-4 py-3 border-b-primary/10 border-x-0 border-t-0"
        style={{
          background: 'var(--gradient-header)',
        }}
      >
        <Card.Title>
          <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        </Card.Title>
        {icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20">
            {icon}
          </div>
        )}
      </Card.Header>

      <Card.Panel className="px-4 py-5 relative">
        <div className="text-3xl font-bold tracking-tight text-primary">
          {loading ? (
            <span className="inline-block w-16 h-7.5 bg-muted animate-pulse rounded" />
          ) : (
            value
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </Card.Panel>
    </Card.Root>
  );
}
