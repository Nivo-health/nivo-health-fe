# Nivo Health FE - Project Stack

Use this file as the default project context for future work.

## Preferred Libraries (Use These First)

- Date/time: `dayjs`
- Server state + API caching: `@tanstack/react-query`
- Global/client state: `zustand`
- Forms: `react-hook-form` + `@hookform/resolvers`
- Validation/schema: `zod`
- UI system: `tailwindcss` (v4) + `shadcn` + `@base-ui/react`/`base-ui`
- Icons: `lucide-react`
- Routing: `react-router-dom`

## Core App Stack

- `react` + `react-dom` (React 19)
- `typescript`
- `vite`
- Node engine: `22.x`

## Styling & UI Utilities

- `tailwindcss`
- `@tailwindcss/postcss`
- `tailwindcss-animate`
- `tw-animate-css`
- `class-variance-authority`
- `clsx`
- `tailwind-merge`

## Data, Forms, Validation

- `@tanstack/react-query`
- `@tanstack/react-query-devtools`
- `react-hook-form`
- `@hookform/resolvers`
- `zod`
- `zustand`

## Tooling

- `eslint` + `@eslint/js`
- `@typescript-eslint/eslint-plugin`
- `@typescript-eslint/parser`
- `eslint-plugin-react`
- `eslint-plugin-react-hooks`
- `eslint-config-prettier`
- `eslint-plugin-prettier`
- `prettier`
- `postcss`
- `autoprefixer`
- `@vitejs/plugin-react`
- `@types/node`
- `@types/react`
- `@types/react-dom`

## NPM Scripts

- `pnpm dev` -> Start Vite dev server
- `pnpm build` -> Type-check + production build
- `pnpm preview` -> Preview production build
- `pnpm lint` -> Run ESLint
- `pnpm lint:fix` -> Auto-fix lint issues
- `pnpm format` -> Run Prettier

## Notes for Future Contributors/Agents

- Follow existing stack choices before adding new libraries.
- Keep date logic in `dayjs`.
- Keep async/server state in TanStack Query.
- Keep forms in React Hook Form + Zod schemas.

# Project Guidline

- useFilter to handle all type of filter local or api query.
- useModal hook to handle modal states.
- Allways keep code clean and follow SOLID principles.
- Follow components architecture to reduce complex components creation divid in small components.
