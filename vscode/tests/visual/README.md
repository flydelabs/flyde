# Visual Regression Testing

This directory contains visual regression tests for the Flyde VS Code extension using Playwright.

## Overview

The visual tests capture screenshots of the flow editor webview and compare them against baseline images to detect unintended visual changes.

## Test Structure

- **Tests**: `visual-regression.spec.ts` - Main test file
- **Baselines**: Platform-specific baseline images are stored in subdirectories
- **Results**: Test results and diff images are generated in `test-results/`

## Platform Differences

Playwright automatically handles platform differences by storing baselines in OS-specific folders:
- `tests/visual/visual-regression.spec.ts-snapshots/helloworld-flow-light-chromium-linux.png`
- `tests/visual/visual-regression.spec.ts-snapshots/helloworld-flow-light-chromium-darwin.png`
- `tests/visual/visual-regression.spec.ts-snapshots/helloworld-flow-light-chromium-win32.png`

## Running Tests

### Locally

```bash
# Run visual tests
pnpm run test:visual

# Update baselines (after intentional UI changes)
pnpm run test:visual:update

# Run with interactive UI
pnpm run test:visual:ui

# View test report
pnpm run test:visual:report
```

### First Run
On first run, baseline images will be generated automatically. Subsequent runs will compare against these baselines.

## CI/CD Integration

Visual tests run automatically on pull requests that modify:
- VS Code extension code (`vscode-extension/**`)
- Flow editor code (`flow-editor/**`)
- Visual test workflows

### PR Workflow

1. **Tests Run**: Visual tests execute on every PR
2. **Failures**: If tests fail, a comment is posted with details
3. **Artifacts**: Test results and diff images are uploaded as artifacts
4. **Review**: Download artifacts to review visual differences

### Handling Failures

When visual tests fail in CI:

1. **Download Artifacts**: 
   - Go to the failed GitHub Action run
   - Download `visual-test-results` artifact
   - Extract and examine diff images

2. **Review Changes**:
   - Check `*-diff.png` files to see what changed
   - Compare with `*-expected.png` and `*-actual.png`

3. **Update Baselines** (if changes are intentional):
   ```bash
   cd vscode-extension
   pnpm run test:visual:update
   git add tests/visual/
   git commit -m "Update visual test baselines"
   git push
   ```

## Configuration

Visual test settings are in `playwright.config.ts`:

- **Threshold**: `0.2` - Allows small differences due to font rendering
- **Mode**: `'os'` - Platform-specific baselines
- **Animations**: Disabled for consistent screenshots
- **Viewport**: Fixed 1200x800 resolution

## Troubleshooting

### Tests Failing Locally

1. **Font Differences**: Different operating systems may render fonts slightly differently
2. **Screen Resolution**: Ensure your display scaling is set to 100%
3. **Browser Version**: Run `npx playwright install chromium` to update

### CI/CD Issues

1. **Missing Baselines**: Push updated baselines to the repository
2. **Platform Differences**: Baselines are OS-specific - update them on the target platform
3. **Flaky Tests**: Increase `threshold` in config if tests are too sensitive

### Common Commands

```bash
# Install/update browsers
npx playwright install chromium

# Run single test
npx playwright test visual-regression.spec.ts

# Run with debug mode
npx playwright test --debug

# Generate baseline for specific test
npx playwright test visual-regression.spec.ts --update-snapshots

# Run headed (with browser window)
npx playwright test --headed
```

## Best Practices

1. **Baseline Management**: Always review baselines before committing
2. **Platform Testing**: Test on the same OS as your CI/CD environment
3. **Threshold Tuning**: Adjust threshold based on your tolerance for visual differences
4. **Selective Testing**: Only test stable UI elements, avoid testing loading states
5. **Documentation**: Update this README when adding new tests or changing configuration