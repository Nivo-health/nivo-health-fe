# Skill Compliance Audit (Post-Fix Rerun)

Audit date: 2026-02-08  
Scope: current codebase (`src/`, root configs) against active skills.

## Snapshot Metrics

- `lucide-react` barrel imports in `src/`: **0**
- Inline screen-level modals (`<Dialog.Root>` in `src/screens`): **0**
- Non-`kebab-case` TypeScript filenames in `src/`: **0**
- Raw HTML form/control elements outside `src/components/ui/*`: **16**
- `console.log`/`console.error`/`console.warn` occurrences in `src/`: **78**
- Native date API usages (`new Date`/locale formatting): **15**

Largest screen files:
- `src/screens/prescription.tsx` (856)
- `src/screens/visits.tsx` (557)
- `src/screens/doctor-schedule-settings.tsx` (405)
- `src/screens/appointments.tsx` (396)

## Resolved Gaps

### 1) `tailwind-v4-shadcn`

- `components.json` updated to v4 pattern (`"tailwind.config": ""`).
- Legacy `tailwind.config.js` removed.
- `@apply` usage removed from `src/index.css` base layer.
- Dark custom variant updated to recommended `@:where(.dark, .dark *)` pattern.
- Base styles now use direct CSS variable declarations.

### 2) `tanstack-query`

- Query keys now include all query inputs:
  - `patientSearch(query, limit)`
  - `visitsByPatient(patientId, limit)`
- `Visits` duplicate-fetch flow removed by switching to `usePatientSearchLazy()` mutation flow.
- React Query Devtools now render only in dev (`import.meta.env.DEV`).

### 3) `vercel-react-best-practices`

- Route-level code splitting implemented using `React.lazy` + `Suspense` in `src/app.tsx`.
- Immutable sorting pattern applied in `src/api/visits.api.ts` (`toSorted`).
- Barrel icon imports replaced with per-icon subpath imports.
  - Added `src/types/lucide-icon-modules.d.ts` for icon subpath typing.

### 4) `ui-ux-pro-max` + `web-design-guidelines`

- Non-semantic clickable containers in key audited screens replaced with semantic buttons:
  - `src/screens/visits.tsx`
  - `src/screens/all-patients.tsx`
  - `src/screens/patient-search.tsx`
  - `src/screens/patient-details.tsx`
- Date picker nav buttons now include `aria-label`.
- Emoji-based functional row icons replaced with text labels in audited screens.
- `type="tel"` fields in audited forms now include mobile ergonomics attrs (`inputMode`, `autoComplete`, `pattern`).

### 5) `frontend-architecture-dx`

- Screen-level modal JSX extracted to dedicated feature modal files:
  - `src/components/all-patients/modals/add-patient-modal.tsx`
  - `src/components/patient-search/modals/add-patient-modal.tsx`
  - `src/components/visits/modals/create-visit-modal.tsx`
  - `src/components/doctor-schedule/modals/working-hour-modal.tsx`
  - `src/components/prescription/modals/send-whatsapp-modal.tsx`
- `kebab-case` migration completed for all `src/` TypeScript filenames and import paths.

### 6) Date Standardization (Project Stack)

- Core audited date flows moved to `dayjs` in:
  - `src/screens/appointments.tsx`
  - `src/screens/visits.tsx`
  - `src/screens/patient-details.tsx`
  - `src/components/ui/date-picker.tsx`
  - `src/api/patients.api.ts`
  - `src/api/visits.api.ts`

## Remaining Gaps (Actionable Backlog)

1. Tailwind plugin dependency alignment:
- `vite.config.ts` includes optional dynamic loading for `@tailwindcss/vite`, but package install is pending local network/package-manager availability.

2. Architecture thinning still pending for very large screens:
- `src/screens/prescription.tsx`
- `src/screens/visits.tsx`
- `src/screens/doctor-schedule-settings.tsx`
- `src/screens/appointments.tsx`

3. Design-system-first hardening still has residual raw controls (count: 16) that can be further migrated to shared UI primitives.

4. Console cleanup/logging policy not yet enforced (count: 78).
