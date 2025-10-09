# Repository Guidelines

## Project Structure & Module Organization
- `app/` hosts Next.js 15 server and client routes (`layout.tsx`, route segments such as `login/` and `signup/`) plus global styles in `app/globals.css`.
- `components/` holds shared UI, with shadcn-inspired primitives under `components/ui/` and marketing sections in sibling files; favor reusing these instead of redefining markup.
- `lib/` centralizes helpers like `utils.ts` and font loaders; `hooks/` keeps custom hooks (`use-toast`, `use-mobile`) referenced via the `@/*` path alias configured in `tsconfig.json`.
- Static assets live in `public/`; global CSS tokens remain in `styles/globals.css` and are imported through the `app` entrypoint.

## Build, Test, and Development Commands
- `npm install` (preferred: keep `package-lock.json` authoritative) or `pnpm install` when you explicitly update `pnpm-lock.yaml`.
- `npm run dev` starts the Next.js dev server at `http://localhost:3000` with live reload.
- `npm run build` performs a production build (`.next/` output) and will fail on type or lint errors.
- `npm run start` launches the production server after a successful build.
- `npm run lint` invokes `next lint` using the framework’s TypeScript-aware ESLint configuration.

## Coding Style & Naming Conventions
- TypeScript is strict; prefer typed props and utility return values. Components are PascalCase (`Hero`), hooks use the `useX` naming (see `hooks/use-toast.ts`), and files stay kebab-case (`components/animated-background.tsx`).
- Follow the existing two-space indentation and trailing commas in arrays/objects.
- Compose styling with Tailwind utilities inside `className`; extend tokens through `app/globals.css` rather than scattering inline CSS.
- Centralize helpers inside `lib/` to keep route files lean; import via `@/lib/...` to honor the alias map in `components.json`.

## Testing Guidelines
- No automated tests ship yet; when adding coverage, favor React Testing Library or Playwright and store specs under `__tests__/` or alongside the feature folder.
- Add the necessary script (e.g., `"test": "next test"` or `"test": "vitest run"`) to `package.json` with watchable variants for local feedback.
- Keep tests deterministic and focus on critical flows such as authentication and pricing cards; mock network calls within the test layer.

## Commit & Pull Request Guidelines
- Git history isn’t bundled with this workspace; use Conventional Commit semantics (`feat:`, `fix:`, `chore:`) to keep future history machine-readable.
- Ensure each PR includes: summary of changes, screenshots or recordings for UI updates, linked Linear/GitHub issue, and notes on testing or impacted routes.
- Keep PRs scope-limited (one feature or fix), and request review once `npm run lint` and any added tests pass locally.
- Remember to update both lock files only when the associated package manager was used; call it out in the PR description when dependencies change.
