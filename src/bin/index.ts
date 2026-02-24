#!/usr/bin/env node

import { type ChildProcess, spawn } from "child_process";
import chokidar from "chokidar";
import fs from "fs";
import path from "path";

// Determine which register to use:
// - Production: dist/cjs/register.js (built version)
// - Development: ./run-ts.js (transforms TS on the fly)
const distRegisterPath = path.join(process.cwd(), "dist", "cjs", "register.js");
const REGISTER = fs.existsSync(distRegisterPath)
  ? distRegisterPath
  : "./run-ts.js";

// Store the running child process
let child: ChildProcess | null = null;

/**
 * Get default watch ignore patterns
 */
function getIgnorePatterns(): string[] {
  return [
    "**/node_modules/**",
    "**/dist/**",
    "**/coverage/**",
    "**/.git/**",
    "**/*.test.ts",
    "**/*.spec.ts",
  ];
}

/**
 * Kill the running child process
 */
function killChild(): void {
  if (child) {
    child.kill("SIGTERM");
    child = null;
  }
}

/**
 * Start the child process
 */
function startChild(args: string[]): void {
  const entryFile = args[0];

  if (!entryFile) {
    console.error("Error: Please specify a file to run");
    console.error("Usage: rts watch <file>");
    process.exit(1);
  }

  console.log(`\n👀 Watching for changes...`);
  console.log(`   Entry: ${entryFile}`);
  console.log(`   Press Ctrl+C to stop\n`);

  // Spawn child process with RTS
  child = spawn(
    process.execPath,
    ["-r", REGISTER, entryFile, ...args.slice(1)],
    {
      cwd: process.cwd(),
      stdio: "inherit",
    },
  );

  child.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.log(`\n⚠️  Process exited with code ${code}`);
    }
    child = null;
  });
}

/**
 * Restart the child process
 */
function restartChild(args: string[]): void {
  console.log("\n🔄 Restarting...");
  killChild();
  startChild(args);
}

/**
 * Watch mode: monitor file changes and restart
 */
function watch(args: string[]): void {
  const watchPaths = process.cwd();

  // Start the child process initially
  startChild(args);

  // Set up file watcher
  const watcher = chokidar.watch(watchPaths, {
    ignored: getIgnorePatterns(),
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 100,
    },
  });

  // Handle file changes
  watcher.on("change", (filePath) => {
    const ext = path.extname(filePath);
    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      console.log(`📝 File changed: ${filePath}`);
      restartChild(args);
    }
  });

  // Handle add events
  watcher.on("add", (filePath) => {
    const ext = path.extname(filePath);
    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      console.log(`📄 File added: ${filePath}`);
      restartChild(args);
    }
  });

  // Handle unlink events (file deletion)
  watcher.on("unlink", (filePath) => {
    const ext = path.extname(filePath);
    if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
      console.log(`❌ File removed: ${filePath}`);
      restartChild(args);
    }
  });

  // Handle errors
  watcher.on("error", (error) => {
    console.error("Watcher error:", error);
  });

  // Handle Ctrl+C
  process.on("SIGINT", () => {
    console.log("\n\n👋 Stopping watcher...");
    killChild();
    watcher.close();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    killChild();
    watcher.close();
    process.exit(0);
  });
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === "watch") {
  // Watch mode
  watch(args.slice(1));
} else {
  // Run mode (default)
  // Support both "rts <file>" and "rts run <file>"
  const runArgs = command === "run" ? args.slice(1) : args;

  spawn(process.execPath, ["-r", REGISTER, ...runArgs], {
    cwd: process.cwd(),
    stdio: "inherit",
  });
}
