# Contributing to Cozy Village Simulator

Welcome to Willowbrook! We're glad you're here. Whether you're fixing a bug, adding a feature, or improving documentation, every contribution helps make our little village a better place.

## Getting Started

1. **Fork and clone** the repository
2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   cd frontend && npm install
   ```
3. **Run the tests** to make sure everything works:
   ```bash
   python -m pytest test_weather.py test_villagers.py test_garden.py test_animals.py test_economy.py test_game.py
   ```
4. **Create a branch** for your changes:
   ```bash
   git checkout -b your-feature-name
   ```

## Project Overview

The codebase is organized into subsystem modules, each with a matching test file:

| Module | What it does |
|--------|-------------|
| `villagers.py` | NPC personalities, schedules, and friendships |
| `weather.py` | Seasonal weather engine with magical events |
| `garden.py` | Farming, crops, and growth mechanics |
| `animals.py` | Pet companions and bonding |
| `economy.py` | Market trading and pricing |
| `crafting.py` | Recipes and material crafting |
| `game.py` | Unified engine that ties everything together |
| `server.py` | FastAPI REST API |
| `frontend/` | React web UI |

## Making Changes

### Code Style

- Keep Python code readable and consistent with the existing style
- Use clear, descriptive names for variables and functions
- Add tests for new functionality in the corresponding `test_*.py` file

### Testing

Always run the test suite before submitting your changes:

```bash
python -m pytest
```

If you're adding a new subsystem, create a `test_<module>.py` file to go with it.

### Frontend

The React frontend lives in `frontend/`. To run it locally:

```bash
cd frontend
npm install
npm run dev
```

The dev server connects to the API at `http://localhost:8000`, so make sure the FastAPI server is running too.

## Submitting a Pull Request

1. Push your branch to your fork
2. Open a pull request against `main`
3. Describe what you changed and why
4. Make sure tests pass

Keep pull requests focused on a single change when possible. Small, well-scoped PRs are easier to review and merge.

## Reporting Bugs

If you find a bug, please open an issue with:

- A short description of the problem
- Steps to reproduce it
- What you expected to happen vs. what actually happened

## Ideas and Feature Requests

Have an idea for a new villager personality, a magical weather event, or a crafting recipe? Open an issue and share it! We love creative suggestions that fit the cozy village theme.

## Code of Conduct

Be kind, be patient, and be welcoming. We're all here to build something fun together.

Thank you for contributing!
