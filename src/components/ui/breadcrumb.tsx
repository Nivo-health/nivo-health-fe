'use client';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import type * as React from 'react';

import { cn } from '@/lib/utils';

function Root({ ...props }: React.ComponentProps<'nav'>) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function List({ className, ...props }: React.ComponentProps<'ol'>) {
  return (
    <ol
      className={cn(
        'wrap-break-word flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm sm:gap-2.5',
        className,
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

function Item({ className, ...props }: React.ComponentProps<'li'>) {
  return (
    <li
      className={cn('inline-flex items-center gap-1.5', className)}
      data-slot="breadcrumb-item"
      {...props}
    />
  );
}

function Link({ className, render, ...props }: useRender.ComponentProps<'a'>) {
  const defaultProps = {
    className: cn('transition-colors hover:text-foreground', className),
    'data-slot': 'breadcrumb-link',
  };

  return useRender({
    defaultTagName: 'a',
    props: mergeProps<'a'>(defaultProps, props),
    render,
  });
}

function Page({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    // biome-ignore lint(a11y/useFocusableInteractive): known
    <span
      aria-current="page"
      aria-disabled="true"
      className={cn('font-normal text-foreground', className)}
      data-slot="breadcrumb-page"
      role="link"
      {...props}
    />
  );
}

function Separator({
  children,
  className,
  ...props
}: React.ComponentProps<'li'>) {
  return (
    <li
      aria-hidden="true"
      className={cn('opacity-80 [&>svg]:size-4', className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}

function Ellipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden="true"
      className={className}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}

export const Breadcrumb = {
  Root,
  List,
  Item,
  Link,
  Page,
  Separator,
  Ellipsis,
};
