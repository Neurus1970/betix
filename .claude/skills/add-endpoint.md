# Skill: Add a New API Endpoint

Follow these steps **in order** when adding a new endpoint to Betix.

## 1. Python Core (business logic)

- Add the route handler in `core/main.py`
- Add business logic in `core/services/<new_service>.py`
- Run: `python3 -m pytest core/tests/ -v` — must pass before continuing

## 2. Node.js Proxy

- Add service in `src/services/<name>Service.js` (proxy call to core, no logic)
- Add controller in `src/controllers/<name>Controller.js` (thin, delegates to service)
- Add route in `src/routes/<name>Routes.js`
- Wire the route in `src/app.js`

## 3. Tests

- Add Jest test in `tests/<name>.test.js` (use Supertest)
- Add pytest test in `core/tests/test_<name>.py`
- Add Cucumber scenario in `features/<name>.feature`

## 4. Verify

```bash
make test   # all tests must pass
make lint   # no ESLint errors
```

## Rules

- The Node.js layer must NOT contain business logic — only proxy the Python response verbatim.
- New endpoints must follow existing naming: `/api/datos/<resource>`.
- Document the endpoint shape in `docs/` if the response schema is non-trivial.
