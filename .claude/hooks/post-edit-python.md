# Hook: Post-Edit Python

**Trigger:** After editing any file under `core/`

**Action:** Run the relevant pytest tests immediately.

```bash
# Run the full Python test suite
python3 -m pytest core/tests/ -v

# Or run only the test file related to what you changed:
python3 -m pytest core/tests/test_<module>.py -v
```

**Why:** Python business logic is the source of truth for the entire system. Regressions here break both the core API and the Node.js proxy layer.

**If tests fail:** Do not proceed to the Node.js layer until Python tests are green.
