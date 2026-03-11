# Skill: Release a New Version

Betix uses **Release Please** (Google) for automated semantic versioning.
Releases are triggered automatically when commits following the Conventional
Commits standard are merged to `main`.

## Normal Workflow (automated)

1. **Develop** on a feature/fix branch and open a PR to `develop`.
2. **Merge** `develop` → `main` via PR.
3. **Release Please** detects the new commits on `main`, opens a release PR
   with bumped VERSION files / `package.json` and a generated `CHANGELOG.md`.
4. **Review** the release PR — adjust the changelog if needed.
5. **Merge** the release PR. Release Please creates the Git tag and GitHub
   Release automatically.

## Version Bump Rules

| Commit type | Bump |
|---|---|
| `feat:` | Minor — `0.X.0` |
| `fix:` | Patch — `0.0.X` |
| `refactor:`, `docs:`, `chore:`, `test:` | No bump |
| `BREAKING CHANGE:` in commit body | Major — `X.0.0` |

## Independent Components

Each component has its own version, changelog, and Git tag:

| Component | Path | Tag format |
|---|---|---|
| Python core | `core/` | `betix-core-vX.Y.Z` |
| Node.js API | `src/` | `betix-api-vX.Y.Z` |
| nginx frontend | `frontend/` | `betix-frontend-vX.Y.Z` |

Release Please only bumps the components whose files were touched in the
merged commits — unaffected components keep their current version.

## Emergency Manual Bypass

Only use `make bump-*` when Release Please automation is unavailable
(e.g., pipeline incident, bootstrapping a new environment):

```bash
make bump-api      v=X.Y.Z   # updates src/VERSION + package.json
make bump-core     v=X.Y.Z   # updates core/VERSION
make bump-frontend v=X.Y.Z   # updates frontend/VERSION
```

After a manual bump, update `.release-please-manifest.json` to match the
new versions so Release Please stays in sync on the next run.

## Notes

- Never push directly to `main`.
- Version files follow [SemVer](https://semver.org/): MAJOR.MINOR.PATCH.
- Release Please is idempotent: if a release PR already exists it updates it
  rather than creating a duplicate.
- The `release.yml` workflow requires `contents: write` and
  `pull-requests: write` permissions — already configured.
