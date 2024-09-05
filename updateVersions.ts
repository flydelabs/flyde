import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const bumpType = process.argv[2]; // 'patch' or 'minor'

if (!["patch", "minor"].includes(bumpType)) {
  console.error('Invalid bump type. Use "patch" or "minor".');
  process.exit(1);
}

const workspacePackages = JSON.parse(
  execSync("pnpm list -r --json").toString()
);

workspacePackages.forEach((pkg: any) => {
  try {
    const packageJsonPath = join(pkg.path, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    if (!packageJson.version) {
      console.info(`Skipping package [${pkg.path}], no version present`);
    }

    const [major, minor, patch] = packageJson.version.split(".").map(Number);

    if (bumpType === "patch") {
      packageJson.version = `${major}.${minor}.${patch + 1}`;
    } else if (bumpType === "minor") {
      packageJson.version = `${major}.${minor + 1}.0`;
    }

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated ${pkg.name} to version ${packageJson.version}`);
  } catch (e) {
    console.error(`Failed to bump package ${pkg.path}`);
  }
});
