# Contributing to Cozy Village

Thank you for your interest in contributing to Cozy Village! This guide covers everything you need to get started -- from setting up your local environment to opening a pull request.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Monorepo Layout](#monorepo-layout)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Security Guidelines](#security-guidelines)
- [Error Handling](#error-handling)
- [Pull Request Process](#pull-request-process)
- [Adding a New App or Package](#adding-a-new-app-or-package)
- [Reporting Issues](#reporting-issues)
- [Code of Conduct](#code-of-conduct)

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 20+ | JavaScript runtime |
| npm | 10+ | Package manager (ships with Node) |
| Python | 3.10+ | Backend runtime |
| Git | 2.30+ | Version control |

## Local Development Setup

### 1. Fork and Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/cozy-village.git
cd cozy-village
```

### 2. Install Dependencies

```bash
# JavaScript dependencies (all workspaces)
npm install

# Python dependencies (API backend)
pip install -r apps/api/requirements.txt
```

### 3. Start Development Servers

```bash
# Start everything (API + Web + Companion + Mood Journal + Beta)
npx turbo dev

# Or start a single workspace
npx turbo dev --filter=@cozy-village/web
npx turbo dev --filter=@cozy-village/api
npx turbo dev --filter=@cozy-village/cozy-companion
```

| Service | URL |
|---------|-----|
| Web app | `http://localhost:5173` |
| Beta app | `http://localhost:5175` |
| API | `http://localhost:8000` (proxied via `/api` on the web app) |

### 4. Verify Your Setup

```bash
npx turbo build   # Build all packages
npx turbo test    # Run all tests
npx turbo lint    # Lint all packages
```

If all commands pass, you're ready to contribute.

---

## Monorepo Layout

This project uses **Turborepo** with **npm workspaces**.

```
cozy-village/
├── apps/
│   ├── api/               # Python/FastAPI backend (@cozy-village/api)
│   ├── web/               # React + Vite frontend (@cozy-village/web)
│   ├── beta/              # React + Vite app (@cozy-village/beta)
│   ├── cozy-companion/    # Wellness companion app (@cozy-village/cozy-companion)
│   └── mood-journal/      # Mood tracking app (@cozy-village/mood-journal)
├── packages/
│   ├── ui/                # Shared pastel-themed component library (@cozy-village/ui)
│   ├── zen-garden/        # Canvas-based zen garden component (@cozy-village/zen-garden)
│   └── utils/             # Shared utility functions (@cozy-village/utils)
├── turbo.json             # Turborepo pipeline config
├── tsconfig.json          # Root TypeScript config
├── .prettierrc            # Prettier formatting rules
└── package.json           # npm workspaces root
```

### Turborepo Tasks

| Task | Command | Description |
|------|---------|-------------|
| `dev` | `npx turbo dev` | Start all dev servers (not cached) |
| `build` | `npx turbo build` | Build all packages (outputs to `dist/`) |
| `test` | `npx turbo test` | Run all test suites |
| `lint` | `npx turbo lint` | Lint all packages |

Filter to a specific workspace with `--filter`:

```bash
npx turbo test --filter=@cozy-village/api
npx turbo lint --filter=@cozy-village/web
```

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/my-feature
   ```

2. **Make your changes** in small, focused commits.

3. **Run tests and lint** before pushing:
   ```bash
   npx turbo test lint
   ```

4. **Push and open a pull request** against `main`.

### Branch Naming Conventions

| Prefix | Use Case | Example |
|--------|----------|---------|
| `feat/` | New feature | `feat/pet-grooming` |
| `fix/` | Bug fix | `fix/weather-crash` |
| `refactor/` | Code restructuring | `refactor/error-handling` |
| `docs/` | Documentation only | `docs/api-endpoints` |
| `chore/` | Tooling, CI, dependencies | `chore/upgrade-vite` |
| `security/` | Security fix or audit | `security/input-validation` |

---

## Coding Standards

### JavaScript / TypeScript

**Prettier** is the project formatter. The configuration (`.prettierrc`):

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

**TypeScript** uses strict mode (`"strict": true`) with ES2020 target and ESNext modules. See `tsconfig.json` for the full compiler configuration.

**Key conventions:**

- Use single quotes for strings.
- Always include semicolons.
- Use `const` by default; use `let` only when reassignment is needed.
- Prefer named exports over default exports.
- Use TypeScript for all new code in `packages/`. Apps may use plain JavaScript where established.
- Keep components small and focused -- one component per file.
- Use the shared `@cozy-village/ui` library for any pastel-themed UI elements.

**Running the formatter:**

```bash
npx prettier --write "apps/**/*.{ts,tsx,js,jsx}" "packages/**/*.{ts,tsx,js,jsx}"
```

### Python (API)

- Follow [PEP 8](https://peps.python.org/pep-0008/) style guidelines.
- Use type hints for function signatures.
- Keep FastAPI route handlers thin -- delegate business logic to service modules.
- Use `async def` for route handlers where possible.

---

## Testing

### JavaScript / TypeScript

The project uses **Vitest** for JavaScript/TypeScript testing.

```bash
# Run all JS/TS tests
npx turbo test

# Run tests for a specific workspace
npx turbo test --filter=@cozy-village/web
npx turbo test --filter=@cozy-village/utils

# Run tests in watch mode (within a workspace directory)
cd packages/utils
npx vitest --watch
```

**Guidelines:**

- Place test files alongside source code or in a `tests/` directory.
- Name test files with `.test.ts` or `.test.tsx` suffixes.
- Write unit tests for utility functions and shared logic.
- Write component tests for UI components in `packages/ui`.
- Aim for meaningful coverage -- focus on business logic and edge cases, not boilerplate.

### Python (API)

The backend uses **Pytest**.

```bash
# Run API tests
npx turbo test --filter=@cozy-village/api

# Or directly
cd apps/api
pytest
```

**Guidelines:**

- Place tests in `apps/api/tests/`.
- Use fixtures for shared test setup.
- Test API endpoints with FastAPI's `TestClient`.
- Mock external dependencies where necessary.

---

## Security Guidelines

Security is a priority across the project. Follow these practices for all contributions:

### Input Validation

- **Never trust user input.** Validate and sanitize all data at system boundaries.
- Use FastAPI's Pydantic models for request validation on the backend.
- Validate props and user input in frontend components before processing.

### Common Vulnerabilities to Avoid

- **XSS**: Never use `dangerouslySetInnerHTML` without explicit sanitization. Escape user-provided content rendered in the DOM.
- **Injection**: Use parameterized queries for any data store interactions. Never interpolate user input into commands or queries.
- **Sensitive Data**: Never commit secrets, API keys, or credentials. Use environment variables for configuration.
- **Dependencies**: Keep dependencies up to date. Run `npm audit` regularly and address vulnerabilities promptly.

### Reporting Security Issues

If you discover a security vulnerability, **do not open a public issue**. Instead, contact the maintainers directly so it can be addressed before disclosure.

---

## Error Handling

Consistent error handling improves reliability and debugging. Follow these patterns:

### Frontend (React)

- Use error boundaries to catch rendering errors gracefully.
- Handle async errors (fetch calls, promises) with try/catch or `.catch()`.
- Display user-friendly messages -- never expose raw error details to users.
- Use the project logger (`src/logger.ts`) for structured error logging:
  ```ts
  import { createLogger } from './src/logger';
  const logger = createLogger({ context: 'MyComponent' });
  logger.error('Failed to load villager data', error);
  ```

### Backend (FastAPI)

- Use FastAPI exception handlers for consistent API error responses.
- Return appropriate HTTP status codes (400 for bad input, 404 for missing resources, 500 for server errors).
- Log errors with sufficient context for debugging.
- Never expose stack traces or internal details in production API responses.

---

## Pull Request Process

### Before Submitting

1. **Rebase on latest `main`** to avoid merge conflicts:
   ```bash
   git fetch origin
   git rebase origin/main
   ```
2. **Run the full check suite:**
   ```bash
   npx turbo build test lint
   ```
3. **Review your own diff** -- remove debug code, console logs, and commented-out code.

### PR Requirements

- **Title**: Use a clear, descriptive title (e.g., "Add pet grooming system" not "Updates").
- **Description**: Explain *what* changed and *why*. Include:
  - Summary of the changes
  - Related issue number (if applicable)
  - Screenshots for UI changes
  - Testing steps for reviewers
- **Scope**: Keep PRs focused. One feature or fix per PR. Large changes should be broken into smaller, reviewable PRs.
- **Tests**: Include tests for new functionality. Bug fixes should include a regression test.
- **No breaking changes** without prior discussion with maintainers.

### Review Process

- All PRs require at least one approving review before merge.
- Reviewers will check for correctness, test coverage, code style, and security concerns.
- Address review feedback with new commits (do not force-push during review).
- Once approved, a maintainer will merge your PR.

---

## Adding a New App or Package

1. Create the directory under `apps/` or `packages/` as appropriate.
2. Add a `package.json` with the `@cozy-village/` scope:
   ```json
   {
     "name": "@cozy-village/my-new-package",
     "version": "0.0.1",
     "private": true
   }
   ```
3. For shared React components, use the `@cozy-village/ui` library.
4. Add `dev`, `build`, `test`, and `lint` scripts to your `package.json` -- Turborepo auto-discovers workspaces.
5. Update the root `README.md` monorepo table with your new workspace.

---

## Reporting Issues

If you find a bug or have a feature request, please open an issue with:

- A clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs. actual behavior
- Browser/OS/Node version (if relevant)

---

## Code of Conduct

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them get started.
- Focus on the work, not the person.
- Assume good intent and ask questions before jumping to conclusions.

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
