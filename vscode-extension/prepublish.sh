# convert local workspaces version latest, as the github action doesn't run on the full monorepo but just on the vscode-extension folder
sed -i '' 's/"workspace:\*"/"latest"/g' package.json
