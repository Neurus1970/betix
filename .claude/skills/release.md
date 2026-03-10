# Skill: Release a New Version

Betix has **independent versions per service**. Only bump the services that changed.

## 1. Determine What Changed

- `src/` changed → bump API version
- `core/` changed → bump Core version
- `frontend/` changed → bump Frontend version

## 2. Bump VERSION Files

```bash
make bump-api      v=X.Y.Z   # updates src/VERSION
make bump-core     v=X.Y.Z   # updates core/VERSION
make bump-frontend v=X.Y.Z   # updates frontend/VERSION
```

## 3. Verify Tests Pass

```bash
make test    # all suites must be green
make lint    # no linting errors
```

## 4. Commit and Tag

```bash
git add src/VERSION core/VERSION frontend/VERSION   # only the ones changed
git commit -m "release: vX.Y.Z — <short description>"
git tag vX.Y.Z
git push origin develop --tags
```

## 5. Merge to Main (via PR)

- Open a PR from `develop` → `main`
- Title: `release: vX.Y.Z`
- The `build.yml` workflow triggers on the tag and pushes Docker images to ECR.

## Notes

- Do **not** push directly to `main`.
- Version files follow [SemVer](https://semver.org/): MAJOR.MINOR.PATCH.
- A git tag triggers the Docker build pipeline — ensure tests pass before tagging.
