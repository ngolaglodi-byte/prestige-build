# Branch Protection Rules

## Recommended Configuration for `main`

Apply these settings in **Settings → Branches → Branch protection rules**:

### Required Settings
- [x] Require a pull request before merging
  - Required approving reviews: **1**
  - Dismiss stale pull request approvals when new commits are pushed
- [x] Require status checks to pass before merging
  - Required checks: `Lint`, `Build`, `Unit Tests`, `E2E Tests`
- [x] Require conversation resolution before merging
- [x] Require linear history
- [x] Do not allow bypassing the above settings

### Recommended Settings
- [x] Require branches to be up to date before merging
- [x] Restrict who can push to matching branches (use CODEOWNERS)
