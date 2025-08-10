/**
 * Release script for RTS (Runtime Transformer System) using Changeset
 *
 * This script automates the release process using @changesets/cli.
 * It handles version bumping, changelog generation, and publishing.
 *
 * Prerequisites:
 * - @changesets/cli installed globally or locally
 * - Changeset files created with `pnpm changeset`
 *
 * Usage:
 * ```bash
 * # Create a changeset (interactive)
 * pnpm changeset
 *
 * # Build the project
 * pnpm run build
 *
 * # Release with changeset
 * pnpm run release
 *
 * # Dry run (no actual changes)
 * pnpm run release --dry-run
 * ```
 */

import { execSync } from "child_process";
import fs from "fs";
import { assemble } from "t-packer";

const build = () => {
  return assemble();
};

/**
 * Release configuration
 */
interface ReleaseConfig {
  /** Whether this is a dry run (no actual changes) */
  dryRun: boolean;
  /** Whether to skip build process */
  skipBuild: boolean;
  /** Whether to skip tests */
  skipTests: boolean;
}

/**
 * Check if changeset is installed
 */
function checkChangesetInstalled(): void {
  try {
    execSync("pnpm changeset --version", { stdio: "pipe" });
  } catch (error) {
    console.error("❌ @changesets/cli is not installed");
    console.error("Please install it with: pnpm add -D @changesets/cli");
    process.exit(1);
  }
}

/**
 * Check if there are any changeset files
 */
function checkChangesetFiles(): void {
  const changesetDir = ".changeset";
  if (!fs.existsSync(changesetDir)) {
    console.error("❌ .changeset directory not found");
    console.error("Please initialize changeset with: pnpm changeset init");
    process.exit(1);
  }

  const changesetFiles = fs
    .readdirSync(changesetDir)
    .filter((file) => file.endsWith(".md") && file !== "README.md");

  if (changesetFiles.length === 0) {
    console.error("❌ No changeset files found");
    console.error("Please create changesets with: pnpm changeset");
    process.exit(1);
  }

  console.log(`✅ Found ${changesetFiles.length} changeset(s)`);
}

/**
 * Run tests to ensure everything works
 */
function runTests(): void {
  console.log("🧪 Running tests...");
  try {
    execSync("pnpm test", { stdio: "inherit" });
    console.log("✅ Tests passed");
  } catch (error) {
    console.error("❌ Tests failed");
    process.exit(1);
  }
}

/**
 * Build the project
 *
 * This function calls the build script that you will implement.
 * The build process should:
 * - Compile TypeScript to JavaScript
 * - Generate type definitions
 * - Create distribution files
 * - Validate build output
 */
function buildProject(): void {
  console.log("🔨 Building project...");
  try {
    // Call the build script that you will implement
    build();
    console.log("✅ Build completed");
  } catch (error) {
    console.error("❌ Build failed");
    console.error("Please implement the build script in package.json");
    process.exit(1);
  }
}

/**
 * Run changeset version command
 */
function runChangesetVersion(): void {
  console.log("📝 Running changeset version...");
  try {
    execSync("pnpm changeset version", { stdio: "inherit" });
    console.log("✅ Version updated");
  } catch (error) {
    console.error("❌ Failed to update version");
    process.exit(1);
  }
}

/**
 * Publish to npm using changeset
 */
function publishToNpm(config: ReleaseConfig): void {
  if (config.dryRun) {
    console.log("🔍 Dry run: Would publish to npm");
    return;
  }

  console.log("📦 Publishing to npm...");
  try {
    execSync("pnpm changeset publish", { stdio: "inherit" });
    console.log("✅ Published to npm");
  } catch (error) {
    console.error("❌ Failed to publish to npm");
    process.exit(1);
  }
}

/**
 * Get current version from package.json
 */
function getCurrentVersion(): string {
  try {
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
    return packageJson.version;
  } catch (error) {
    console.error("❌ Failed to read package.json");
    process.exit(1);
  }
}

/**
 * Create git tag for the release
 */
function createGitTag(config: ReleaseConfig): void {
  if (config.dryRun) {
    console.log("🔍 Dry run: Would create git tag");
    return;
  }

  const version = getCurrentVersion();
  const tagName = `v${version}`;

  console.log(`🏷️  Creating git tag ${tagName}...`);
  try {
    // Create the tag
    execSync(`git tag ${tagName}`, { stdio: "inherit" });

    // Push the tag to remote
    execSync(`git push origin ${tagName}`, { stdio: "inherit" });

    console.log(`✅ Git tag ${tagName} created and pushed`);
  } catch (error) {
    console.error(`❌ Failed to create git tag ${tagName}`);
    process.exit(1);
  }
}

/**
 * Main release function
 */
function release(config: ReleaseConfig): void {
  console.log("🚀 Starting release process...");

  if (config.dryRun) {
    console.log("🔍 DRY RUN MODE - No actual changes will be made");
  }

  try {
    // Check prerequisites
    checkChangesetInstalled();
    checkChangesetFiles();

    // Run tests (unless skipped)
    if (!config.skipTests) {
      runTests();
    }

    // Build project (unless skipped)
    if (!config.skipBuild) {
      buildProject();
    }

    if (!config.dryRun) {
      // Run changeset version (updates package.json and CHANGELOG.md)
      runChangesetVersion();

      // Publish to npm
      publishToNpm(config);
    }

    console.log("🎉 Release completed successfully!");
  } catch (error) {
    console.error("❌ Release failed:", error);
    process.exit(1);
  }
}

/**
 * Initialize changeset (helper function)
 */
function initChangeset(): void {
  console.log("🔧 Initializing changeset...");
  try {
    execSync("pnpm changeset init", { stdio: "inherit" });
    console.log("✅ Changeset initialized");
  } catch (error) {
    console.error("❌ Failed to initialize changeset");
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === "init") {
  initChangeset();
  process.exit(0);
}

const config: ReleaseConfig = {
  dryRun: args.includes("--dry-run"),
  skipBuild: args.includes("--skip-build"),
  skipTests: args.includes("--skip-tests"),
};

// Show help if no command or invalid command
if (
  !command ||
  (command !== "init" && !["release", "build", "test", "tag"].includes(command))
) {
  console.log(`
Usage: pnpm run release [options]

Commands:
  release    Run the full release process
  init       Initialize changeset (first time setup)
  tag        Create git tag for current version

Options:
  --dry-run      Run without making actual changes
  --skip-build   Skip the build process
  --skip-tests   Skip running tests

Examples:
  pnpm run release              # Full release
  pnpm run release --dry-run   # Dry run
  pnpm run release init        # Initialize changeset
  pnpm run release --skip-build # Skip build step
`);
  process.exit(1);
}

if (command === "release") {
  release(config);
} else if (command === "build") {
  buildProject();
} else if (command === "test") {
  runTests();
} else if (command === "tag") {
  createGitTag(config);
}
