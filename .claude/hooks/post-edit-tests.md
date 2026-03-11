# Hook: Post-Edit Tests

**Trigger:** After editing any file under `tests/`, `features/`, or `features/step_definitions/`

**Action:** Run the affected test suite immediately.

```bash
# If you edited a Jest test (tests/*.test.js):
npm test

# If you edited a Cucumber scenario or step definition (features/):
npm run test:functional

# When in doubt, run both:
make test-api
```

**Why:** Catching broken tests at edit time avoids discovering failures only in CI. Jest and Cucumber run in under 2 seconds locally.

**If tests fail:** Fix the test or the step definition before committing — never disable a test to make CI pass.
