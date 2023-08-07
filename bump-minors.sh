 for package in $(pnpm list --json --only-projects -r | jq -c '.[]'); do
    name=$(echo $package | jq -r '.name')
    path=$(echo $package | jq -r '.path')
    cd $path
    is_private=$(echo $package | jq '.private')
    if [[ "$is_private" == "true" ]]; then
        echo "Skipping private package: $name"
        cd $root
        continue
    fi  
    echo "Bumping version of $name"
    pnpm version minor
    cd $root
done