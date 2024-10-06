# Navigate to the vscode-extension folder
cd vscode-extension

# Detect the operating system and set the appropriate sed command
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  sed -i '' 's/"workspace:\*"/"latest"/g' package.json
else
  # Linux
  sed -i 's/"workspace:\*"/"latest"/g' package.json
fi
