'use client';

import { Dialog as SheetPrimitive } from '@base-ui/react/dialog';
import XIcon from 'lucide-react/dist/esm/icons/x';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const Root = SheetPrimitive.Root;

const Portal = SheetPrimitive.Portal;

function Trigger(props: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}

function Close(props: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}

function Backdrop({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      className={cn(
        'fixed inset-0 z-50 bg-black/32 backdrop-blur-sm transition-all duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0',
        className,
      )}
      data-slot="sheet-backdrop"
      {...props}
    />
  );
}

function Viewport({
  className,
  side,
  variant = 'default',
  ...props
}: SheetPrimitive.Viewport.Props & {
  side?: 'right' | 'left' | 'top' | 'bottom';
  variant?: 'default' | 'inset';
}) {
  return (
    <SheetPrimitive.Viewport
      className={cn(
        'fixed inset-0 z-50 grid',
        side === 'bottom' && 'grid grid-rows-[1fr_auto] pt-12',
        side === 'top' && 'grid grid-rows-[auto_1fr] pb-12',
        side === 'left' && 'flex justify-start',
        side === 'right' && 'flex justify-end',
        variant === 'inset' && 'sm:p-4',
      )}
      data-slot="sheet-viewport"
      {...props}
    />
  );
}

function Popup({
  className,
  children,
  showCloseButton = true,
  side = 'right',
  variant = 'default',
  ...props
}: SheetPrimitive.Popup.Props & {
  showCloseButton?: boolean;
  side?: 'right' | 'left' | 'top' | 'bottom';
  variant?: 'default' | 'inset';
}) {
  return (
    <Portal>
      <Backdrop />
      <Viewport side={side} variant={variant}>
        <SheetPrimitive.Popup
          className={cn(
            'relative flex max-h-full min-h-0 w-full min-w-0 flex-col bg-popover not-dark:bg-clip-padding text-popover-foreground shadow-lg/5 transition-[opacity,translate] duration-200 ease-in-out will-change-transform before:pointer-events-none before:absolute before:inset-0 before:shadow-[0_1px_--theme(--color-black/4%)] data-ending-style:opacity-0 data-starting-style:opacity-0 max-sm:before:hidden dark:before:shadow-[0_-1px_--theme(--color-white/6%)]',
            side === 'bottom' &&
              'row-start-2 border-t data-ending-style:translate-y-8 data-starting-style:translate-y-8',
            side === 'top' &&
              'data-ending-style:-translate-y-8 data-starting-style:-translate-y-8 border-b',
            side === 'left' &&
              'data-ending-style:-translate-x-8 data-starting-style:-translate-x-8 w-[calc(100%-(--spacing(12)))] max-w-md border-e',
            side === 'right' &&
              'col-start-2 w-[calc(100%-(--spacing(12)))] max-w-md border-s data-ending-style:translate-x-8 data-starting-style:translate-x-8',
            variant === 'inset' &&
              'before:hidden sm:rounded-2xl sm:border sm:before:rounded-[calc(var(--radius-2xl)-1px)] sm:**:data-[slot=sheet-footer]:rounded-b-[calc(var(--radius-2xl)-1px)]',
            className,
          )}
          data-slot="sheet-popup"
          {...props}
        >
          {children}
          {showCloseButton && (
            <SheetPrimitive.Close
              aria-label="Close"
              className="absolute end-2 top-2"
              render={<Button size="icon" variant="ghost" />}
            >
              <XIcon />
            </SheetPrimitive.Close>
          )}
        </SheetPrimitive.Popup>
      </Viewport>
    </Portal>
  );
}

function Header({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 p-6 in-[[data-slot=sheet-popup]:has([data-slot=sheet-panel])]:pb-3 max-sm:pb-4',
        className,
      )}
      data-slot="sheet-header"
      {...props}
    />
  );
}

function Footer({
  className,
  variant = 'default',
  ...props
}: React.ComponentProps<'div'> & {
  variant?: 'default' | 'bare';
}) {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 px-6 sm:flex-row sm:justify-end',
        variant === 'default' && 'border-t bg-muted/72 py-4',
        variant === 'bare' &&
          'in-[[data-slot=sheet-popup]:has([data-slot=sheet-panel])]:pt-3 pt-4 pb-6',
        className,
      )}
      data-slot="sheet-footer"
      {...props}
    />
  );
}

function Title({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      className={cn(
        'font-heading font-semibold text-xl leading-none',
        className,
      )}
      data-slot="sheet-title"
      {...props}
    />
  );
}

function Description({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="sheet-description"
      {...props}
    />
  );
}

function Panel({
  className,
  scrollFade = true,
  ...props
}: React.ComponentProps<'div'> & { scrollFade?: boolean }) {
  return (
    <ScrollArea.Root scrollFade={scrollFade}>
      <div
        className={cn(
          'p-6 in-[[data-slot=sheet-popup]:has([data-slot=sheet-header])]:pt-1 in-[[data-slot=sheet-popup]:has([data-slot=sheet-footer]:not(.border-t))]:pb-1',
          className,
        )}
        data-slot="sheet-panel"
        {...props}
      />
    </ScrollArea.Root>
  );
}

export const Sheet = {
  Root,
  Trigger,
  Portal,
  Close,
  Backdrop,
  Popup,
  Header,
  Footer,
  Title,
  Description,
  Panel,
};
