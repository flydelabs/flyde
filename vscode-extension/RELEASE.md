# Release Process

The release step is semi-manual at the moment and consists of the following steps:

1. Bump all versions to the next patch/minor/major version in the `package.json` files
2. Push the changes, and create a new tag and push it (`git tag VERSION && git push origin tag VERSION`)
3. Create a new release in GitHub with the new tag
4. Run the ״publish to npm״ workflow, wait for all packages to be published
5. Run the ״publish to vscode״ workflow
6. Update CHANGELOG.md with the new version
7. copy CHANGELOG.md to vscode-extension/CHANGELOG.md
