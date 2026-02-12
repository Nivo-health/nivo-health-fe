# Skill Compliance Audit (Rerun)

Audit date: 2026-02-08  
Scope: current codebase (`src/`, root configs) against active skills and project conventions.

## Verification Summary

- `pnpm -s tsc --noEmit`: pass
- `pnpm -s build`: pass

## Snapshot Metrics

- `lucide-react` barrel imports in `src/`: **1** (type-only in `src/types/lucide-icon-modules.d.ts`)
- Inline screen-level modals (`<Dialog.Root>` in `src/screens`): **0**
- Non-`kebab-case` TypeScript filenames in `src/`: **0**
- Raw HTML form/control elements outside `src/components/ui/*`: **16**
- `console.log`/`console.error`/`console.warn` occurrences in `src/`: **78**
- Native date API usages (`new Date`, locale formatters, `Date.now`): **12**

Largest screen files:

- `src/screens/prescription.tsx` (856 lines)
- `src/screens/visits.tsx` (557 lines)
- `src/screens/doctor-schedule-settings.tsx` (405 lines)
- `src/screens/appointments.tsx` (396 lines)
- `src/screens/all-patients.tsx` (331 lines)

## Skill Status

### `frontend-architecture-dx`

Pass:

- All `src/` TS/TSX filenames are now `kebab-case`.
- Modal internals are no longer defined inline in screen files.

Gaps:

- Several screen files are still too heavy and not orchestration-only:
  - `src/screens/prescription.tsx`
  - `src/screens/visits.tsx`
  - `src/screens/doctor-schedule-settings.tsx`
  - `src/screens/appointments.tsx`
  - `src/screens/all-patients.tsx`

### `tailwind-design-system` and design-system-first rule

Pass:

- Shared primitives from `src/components/ui/*` are broadly used.

Gaps:

- 16 raw controls remain outside `src/components/ui/*`, for example:
  - `src/screens/consultation.tsx:82` (`<textarea>`)
  - `src/screens/visit-context.tsx:180` (`<input type="checkbox">`)
  - `src/screens/prescription.tsx:718` (`<input type="radio">`)
  - `src/screens/prescription.tsx:802` (`<input type="checkbox">`)
  - `src/components/dashboard/quick-action-button.tsx:16` (`<button>`)

### `tanstack-query`

Pass:

- Query layer uses v5 object syntax and `queryOptions`.
- Query keys include dynamic inputs for key paths audited (`patientSearch`, `visitsByPatient`, list params).
- No `cacheTime`, `keepPreviousData`, or `useErrorBoundary` usage found.

Gaps:

- None blocking. Optional enhancement backlog can still adopt advanced v5 patterns (`useMutationState`, `throwOnError` boundaries, `networkMode` where applicable).

### `tailwind-v4-shadcn`

Pass:

- Project builds and Tailwind v4 setup is functional.

Gap (pending from previous audit):

- `vite.config.ts` has fallback dynamic import for `@tailwindcss/vite`, but dependency is still not present in `package.json`.

### `vercel-react-best-practices`

Pass:

- Route-level splitting and lazy loading are in place.
- `toSorted()` immutable sorting pattern already applied.

Gap:

- One remaining `lucide-react` barrel import exists as a type import in `src/types/lucide-icon-modules.d.ts:3`.

### Date standardization (`dayjs`)

Pass:

- Most feature screens use `dayjs`.

Gaps:

- Native date APIs remain in key files:
  - `src/screens/visit-context.tsx`
  - `src/screens/print-preview.tsx`
  - `src/screens/patient-details.tsx`
  - `src/utils/print.ts`
  - `src/screens/dashboard.tsx`
  - `src/api/prescriptions.api.ts` (timestamp-based IDs)

## Newly Identified Issues In This Rerun

1. Accessibility/semantics issue in visit history cards:

- `src/screens/visit-context.tsx` uses clickable `<div>` card blocks with `onClick`, which are not keyboard-accessible by default.

2. Barrel import exception still present:

- `src/types/lucide-icon-modules.d.ts:3` imports `LucideProps` from `'lucide-react'` (type-only).

## Pending Items From Previous Audit (Still Open)

1. Install and standardize Tailwind Vite plugin setup:

- Add `@tailwindcss/vite` and remove fallback dynamic import behavior.

2. Thin heavy screens into feature components:

- Continue extracting sections into `src/components/<feature>/*` and keep screens orchestration-only.
  SKILL_GAP_AUDIT.md

3. Design-system-first completion:

- Replace raw `<button>`, `<input>`, `<textarea>` usage with shared primitives (`Button`, `Input`, `Textarea`, `Checkbox`, `RadioGroup`) or dedicated feature wrappers.

4. Logging policy cleanup:

- Remove debug logs from API/screen codepaths and route errors via centralized handling.

5. Finish date API unification:

- Replace remaining `new Date(...).toLocaleDateString(...)` and `new Date().getHours()` with `dayjs`.

## Recommended Fix Order

1. Accessibility and design-system violations (`visit-context`, `consultation`, `prescription`, dashboard/doctor schedule icon action buttons).
2. Date API unification to `dayjs` in screens + `utils/print.ts`.
3. Screen decomposition for the top 5 largest screen files.
4. Console log cleanup and error-surface standardization.
5. Tailwind plugin dependency alignment.
