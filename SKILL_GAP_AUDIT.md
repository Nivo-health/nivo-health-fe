# Skill Compliance Audit (Rerun)

Audit date: 2026-02-08  
Scope: current codebase (`src/`, root configs) against active skills:

- `frontend-architecture-dx`
- `frontend-design`
- `tailwind-design-system`
- `tailwind-v4-shadcn`
- `tanstack-query`
- `ui-ux-pro-max`
- `vercel-react-best-practices`
- `web-design-guidelines`

## Snapshot Metrics

- `lucide-react` barrel imports: **20 files**
- Inline screen-level modals (`<Dialog.Root>` in `src/screens`): **5 files**
- Non-`kebab-case` TypeScript filenames in `src/`: **31 files**
- Raw HTML form/control elements outside `src/components/ui/*`: **36**
- `console.log`/`console.error` occurrences in `src/`: **75**
- Largest screen files:
  - `src/screens/Prescription.tsx` (903)
  - `src/screens/Visits.tsx` (756)
  - `src/screens/DoctorScheduleSettings.tsx` (509)
  - `src/screens/AllPatients.tsx` (460)

## Findings By Skill

### 1) `tailwind-v4-shadcn` (High)

1. `components.json` still uses non-v4 pattern (`tailwind.config` points to file instead of empty string).
   - `components.json`
2. Legacy Tailwind config file still present/active.
   - `tailwind.config.js:1`
   - `tailwind.config.js:7`
3. Vite config is not using `@tailwindcss/vite` plugin pattern from the skill.
   - `vite.config.ts:13`
   - `vite.config.ts:14`
4. `@apply` is still used in base layer (skill flags this as v4 pitfall).
   - `src/index.css:152`
   - `src/index.css:154`
   - `src/index.css:157`
5. Dark custom variant syntax differs from recommended pattern in the skill.
   - `src/index.css:5`

### 2) `tailwind-design-system` (Medium)

1. Semantic token classes are not used consistently; many hardcoded `gray/teal` utility classes remain.
   - `src/screens/Appointments.tsx:128`
   - `src/screens/Appointments.tsx:143`
   - `src/screens/Visits.tsx:321`
   - `src/screens/AllPatients.tsx:140`
2. Core shared UI (`date-picker`) is tightly coupled to teal color literals instead of theme tokens.
   - `src/components/ui/date-picker.tsx:162`
   - `src/components/ui/date-picker.tsx:183`

### 3) `tanstack-query` (High/Medium)

1. Query key misses one queryFn input (`limit`) in patient search.
   - `src/queries/patients.queries.ts:12`
   - `src/queries/patients.queries.ts:14`
   - `src/queries/patients.queries.ts:15`
2. Same cache-key risk in visits-by-patient (`limit` used but not in key).
   - `src/queries/visits.queries.ts:35`
   - `src/queries/visits.queries.ts:37`
   - `src/queries/visits.queries.ts:38`
3. Duplicate fetch behavior in `Visits` flow:
   - query auto-runs via `usePatientSearch(mobileNumber)` and search action triggers `refetch()`.
   - `src/screens/Visits.tsx:70`
   - `src/screens/Visits.tsx:145`
4. Devtools are always mounted (not gated to development).
   - `src/providers/query-provider.tsx:3`
   - `src/providers/query-provider.tsx:10`

### 4) `vercel-react-best-practices` (High/Medium)

1. Barrel imports from `lucide-react` used in 20 files (bundle optimization rule violation).
   - `src/screens/Dashboard.tsx:17`
   - `src/components/layout/Sidebar.tsx:12`
   - `src/components/ui/button.tsx:5`
2. Route-level code splitting is not used; all route screens are eagerly imported.
   - `src/App.tsx:4`
   - `src/App.tsx:5`
   - `src/App.tsx:6`
   - `src/App.tsx:16`
3. Mutating `sort()` used where immutable `toSorted()` is preferred.
   - `src/api/visits.api.ts:129`

### 5) `ui-ux-pro-max` + `web-design-guidelines` (High/Medium)

1. Non-semantic clickable containers reduce keyboard accessibility.
   - `src/components/ui/card.tsx:22`
   - `src/screens/AllPatients.tsx:176`
   - `src/screens/Visits.tsx:447`
   - `src/screens/PatientSearch.tsx:173`
   - `src/screens/PatientDetails.tsx:117`
2. Icon-only date picker navigation buttons are missing accessible labels.
   - `src/components/ui/date-picker.tsx:159`
   - `src/components/ui/date-picker.tsx:180`
3. Emoji are used as functional icons in UI rows.
   - `src/screens/Appointments.tsx:265`
   - `src/screens/Appointments.tsx:272`
   - `src/screens/Visits.tsx:470`
   - `src/screens/AllPatients.tsx:200`
4. `type="tel"` fields miss mobile ergonomics attributes (`inputMode`, `autoComplete`, optional `pattern`).
   - `src/components/dashboard/create-appointment-dialog.tsx:300`
   - `src/screens/Visits.tsx:544`
   - `src/screens/PatientSearch.tsx:255`

### 6) `frontend-design` (Medium, qualitative)

1. Multiple screens still use very similar list-card composition with limited design differentiation.
   - `src/screens/Appointments.tsx:233`
   - `src/screens/Visits.tsx:442`
   - `src/screens/AllPatients.tsx:171`

### 7) `frontend-architecture-dx` (High)

1. Large screen files still combine orchestration + heavy UI rendering.
   - `src/screens/Prescription.tsx`
   - `src/screens/Visits.tsx`
   - `src/screens/DoctorScheduleSettings.tsx`
   - `src/screens/AllPatients.tsx`
2. Screen-level modal implementations are still inline (should move to `src/components/<feature>/modals/*`).
   - `src/screens/AllPatients.tsx:322`
   - `src/screens/PatientSearch.tsx:221`
   - `src/screens/Visits.tsx:529`
   - `src/screens/DoctorScheduleSettings.tsx:391`
   - `src/screens/Prescription.tsx:848`
3. Complex row/list UI remains inline in screens instead of extracted feature components.
   - `src/screens/Appointments.tsx:233`
   - `src/screens/Visits.tsx:442`
   - `src/screens/AllPatients.tsx:171`
   - `src/screens/PatientSearch.tsx:169`
4. `kebab-case` naming rule is not met across many files.
   - `src/screens/Appointments.tsx`
   - `src/screens/DoctorScheduleSettings.tsx`
   - `src/components/layout/Sidebar.tsx`
   - `src/lib/queryClient.ts`
   - `src/utils/dateFormat.ts`
5. Design-system-first rule is not met; ad-hoc raw UI controls are still implemented where design-system components should be used.
   - `src/components/dashboard/create-appointment-dialog.tsx:262`
   - `src/components/dashboard/create-appointment-dialog.tsx:380`
   - `src/screens/AllPatients.tsx:297`
   - `src/screens/Visits.tsx:637`
   - `src/screens/PatientSearch.tsx:299`

## Cross-Cutting Project Stack Gap

Project stack standard says date handling should be `dayjs`, but many modules still use native `Date`.

- `src/screens/Appointments.tsx:93`
- `src/screens/Visits.tsx:36`
- `src/components/ui/date-picker.tsx:20`
- `src/api/visits.api.ts:129`
- `src/api/patients.api.ts:321`

## Suggested Fix Order

1. Tailwind v4/shadcn alignment (`components.json`, Vite Tailwind plugin integration, remove risky `@apply`, remove legacy config path).
2. Accessibility semantics (replace clickable `div/li` patterns with semantic button/link behavior).
3. TanStack Query cache key correctness (`limit` inclusion), then clean duplicate fetch behavior in `Visits`.
4. Bundle/perf cleanup (lucide direct imports, route-level lazy loading, devtools gating).
5. Architecture refactor (move inline modals/large UI blocks from `src/screens` to `src/components/<feature>/***` and replace ad-hoc raw UI with design-system primitives).
6. Naming migration to `kebab-case` with import path updates.
7. Date standardization to `dayjs`.
