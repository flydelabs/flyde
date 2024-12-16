# Release Process

The release step is semi-manual at the moment and consists of the following steps:

1. Run either `pnpm bump:patch` or `pnpm bump:minor` to bump all versions to the next patch/minor/major version in the `package.json` files
2. This will also push the changes to GitHub and create a new tag and push it (`git tag VERSION && git push origin tag VERSION`)
3. Which will trigger the `publish to npm` workflow
4. Create a new release in GitHub with the new tag
5. Run the ״publish to vscode״ workflow
6. Update CHANGELOG.md with the new version
7. copy CHANGELOG.md to vscode-extension/CHANGELOG.md
8. If README.md was changed, copy changes to vscode-extension/README.md but remove the badges section and the logo at the top
