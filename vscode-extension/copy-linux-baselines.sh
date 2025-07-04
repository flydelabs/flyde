#!/bin/bash

# Script to copy Linux baseline images from GitHub Actions artifacts
# Usage: ./copy-linux-baselines.sh /path/to/downloaded/test-results

DOWNLOAD_PATH="$1"
TARGET_DIR="tests/visual/visual-regression.spec.ts-snapshots"

if [ -z "$DOWNLOAD_PATH" ]; then
    echo "Usage: $0 <path-to-downloaded-test-results>"
    echo "Example: $0 /Users/$(whoami)/Downloads/test-results"
    exit 1
fi

if [ ! -d "$DOWNLOAD_PATH" ]; then
    echo "Error: Directory $DOWNLOAD_PATH does not exist"
    exit 1
fi

echo "Copying Linux baseline images from $DOWNLOAD_PATH"
echo "Target directory: $TARGET_DIR"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Map the test result files to correct baseline names
copy_baseline() {
    local source_dir="$1"
    local flow_type="$2"  # light or dark
    local project_type="$3"  # light or dark (project name)
    
    if [ -d "$DOWNLOAD_PATH/$source_dir" ]; then
        local actual_file="$DOWNLOAD_PATH/$source_dir/helloworld-flow-${flow_type}-actual.png"
        local target_file="$TARGET_DIR/helloworld-flow-${flow_type}-chromium-${project_type}-linux.png"
        
        if [ -f "$actual_file" ]; then
            cp "$actual_file" "$target_file"
            echo "✅ Copied: $target_file"
        else
            echo "❌ Not found: $actual_file"
        fi
    fi
}

# Copy all four combinations
# Dark theme test on dark project
copy_baseline "visual-regression-Visual-R-6d7c7-elloWorld-flow---dark-theme-chromium-dark" "dark" "dark"
# Dark theme test on light project  
copy_baseline "visual-regression-Visual-R-6d7c7-elloWorld-flow---dark-theme-chromium-light" "dark" "light"
# Light theme test on dark project
copy_baseline "visual-regression-Visual-R-76965-lloWorld-flow---light-theme-chromium-dark" "light" "dark"
# Light theme test on light project
copy_baseline "visual-regression-Visual-R-76965-lloWorld-flow---light-theme-chromium-light" "light" "light"

echo ""
echo "🎉 Done! Now commit the new baselines:"
echo "  git add tests/visual/"
echo "  git commit -m 'Add Linux baseline images for visual tests'"
echo "  git push"