# Contributing

Thank you for your interest in contributing! Here are some basic guidelines to help you get started.

## Monorepo Layout

This project is a Turborepo monorepo with npm workspaces. Key locations:

- `apps/api` -- Python/FastAPI backend (`@cozy-village/api`)
- `apps/web` -- React/Vite main frontend (`@cozy-village/web`)
- `apps/cozy-companion` -- Wellness companion app (`@cozy-village/cozy-companion`)
- `apps/mood-journal` -- Mood tracking app (`@cozy-village/mood-journal`)
- `packages/ui` -- Shared pastel-themed UI components (`@cozy-village/ui`)
- `packages/zen-garden` -- Zen garden canvas component (`@cozy-village/zen-garden`)
- `packages/utils` -- Shared utility functions (`@cozy-village/utils`)

## How to Contribute

1. **Fork** the repository and create a new branch from `main`.
2. **Make your changes** and ensure they follow the existing code style.
3. **Write tests** for any new functionality.
4. **Run the test suite** to verify nothing is broken.
5. **Submit a pull request** with a clear description of your changes.

### Adding a New App or Package

When adding a new workspace:

1. Create the directory under `apps/` or `packages/` as appropriate.
2. Add a `package.json` with the `@cozy-village/` scope.
3. For shared React components, consider using the `@cozy-village/ui` library.
4. Turbo tasks (`dev`, `build`, `test`, `lint`) will auto-discover new workspaces.

## Reporting Issues

If you find a bug or have a feature request, please open an issue with:

- A clear description of the problem or suggestion
- Steps to reproduce (for bugs)
- Expected vs. actual behavior

## Code of Conduct

- Be respectful and constructive in all interactions.
- Welcome newcomers and help them get started.
- Focus on the work, not the person.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

<!-- test-beta -->
