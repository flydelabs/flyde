import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import readline from "readline";

const bumpType = process.argv[2]; // 'patch' or 'minor'

if (!["patch", "minor"].includes(bumpType)) {
  console.error('Invalid bump type. Use "patch" or "minor".');
  process.exit(1);
}

// Check if current branch is main
const currentBranch = execSync("git rev-parse --abbrev-ref HEAD")
  .toString()
  .trim();
if (currentBranch !== "main") {
  console.error(
    "Not on main branch. Please switch to main branch before running this script."
  );
  process.exit(1);
}

// Check for upstream changes
try {
  execSync("git fetch");
  const status = execSync("git status -uno").toString();
  if (status.includes("Your branch is behind")) {
    console.error(
      "There are upstream changes. Please pull changes before running this script."
    );
    process.exit(1);
  }
} catch (error) {
  console.error("Failed to check for upstream changes:", error);
  process.exit(1);
}

const workspacePackages = JSON.parse(
  execSync("pnpm list -r --json").toString()
);

const versions = new Set<string>();

workspacePackages.forEach((pkg: any) => {
  try {
    const packageJsonPath = join(pkg.path, "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

    if (packageJson.version) {
      versions.add(packageJson.version);
      console.log(`Package: ${pkg.name}, Version: ${packageJson.version}`);
    } else {
      console.info(`Skipping package [${pkg.path}], no version present`);
    }
  } catch (e) {
    console.error(`Failed to read package ${pkg.path}`);
  }
});

if (versions.size > 1) {
  console.error("Not all package versions are the same. Aborting.");
  process.exit(1);
}

const currentVersion = Array.from(versions)[0];
const [major, minor, patch] = currentVersion.split(".").map(Number);
let newVersion = "";

if (bumpType === "patch") {
  newVersion = `${major}.${minor}.${patch + 1}`;
} else if (bumpType === "minor") {
  newVersion = `${major}.${minor + 1}.0`;
}

console.log(`Current version: ${currentVersion}`);
console.log(`New version: ${newVersion}`);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question(
  `Do you want to proceed with the version bump to ${newVersion}? This will push changes to GitHub and create a new tag. (yes/no) `,
  (answer) => {
    if (answer.toLowerCase() !== "yes") {
      console.log("Aborted.");
      rl.close();
      process.exit(0);
    }

    workspacePackages.forEach((pkg: any) => {
      try {
        const packageJsonPath = join(pkg.path, "package.json");
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

        if (!packageJson.version) {
          console.info(`Skipping package [${pkg.path}], no version present`);
          return;
        }

        packageJson.version = newVersion;
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(`Updated ${pkg.name} to version ${packageJson.version}`);
      } catch (e) {
        console.error(`Failed to bump package ${pkg.path}`);
      }
    });

    try {
      execSync("git add .");
      execSync(
        `git commit -m "Bump versions to ${newVersion} for ${bumpType} release"`
      );
      execSync("git push");
      execSync(`git tag v${newVersion}`);
      execSync(`git push origin tag v${newVersion}`);
      console.log("Changes pushed to GitHub and new tag created.");
    } catch (e) {
      console.error("Failed to push changes to GitHub or create a new tag.");
    }

    rl.close();
  }
);
