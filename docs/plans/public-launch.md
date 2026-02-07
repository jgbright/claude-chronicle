# Public Launch

**Status:** proposed

## Overview

Steps to take when making the `jgbright/claude-chronicle` repo public on GitHub.

## Checklist

### Codecov

The CI pipeline already uploads Go and TypeScript coverage to Codecov (see `.github/workflows/ci.yml`), and the README has a badge. But Codecov won't receive data until the repo is activated.

1. Sign in at [codecov.io](https://codecov.io) with GitHub
2. Navigate to `jgbright/claude-chronicle` and activate it
3. No token is needed — the workflow uses GitHub OIDC (`id-token: write` permission)
4. After the first push to main, verify:
   - Codecov PR comments appear with coverage breakdown
   - `codecov/project` and `codecov/patch` status checks show on PRs
   - The README badge resolves to a coverage percentage

### Repository settings

- [ ] Set repo visibility to public
- [ ] Verify GitHub Pages demo site (`claude-chronicle-demo`) still works
- [ ] Confirm GitHub Actions workflows run without issues on the public repo

### Cleanup before going public

- [ ] Audit commit history for any accidentally committed secrets or private paths
- [ ] Review open issues/PRs for anything not meant to be public
- [ ] Confirm `LICENSE` file is present and correct (MIT)
