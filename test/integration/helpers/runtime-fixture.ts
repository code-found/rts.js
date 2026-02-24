import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export interface RuntimeResult {
  status: number | null;
  stdout: string;
  stderr: string;
  error?: Error;
}

export interface RuntimeExecOptions {
  cwd: string;
  entry: string;
  nodeArgs?: string[];
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 20_000;

export const createFixture = (
  name: string,
  files: Record<string, string>,
): string => {
  const baseDir = path.join(os.tmpdir(), "rts-runtime-integration");
  const randomId = Math.random().toString(36).slice(2);
  const fixtureDir = path.join(baseDir, `${name}-${Date.now()}-${randomId}`);

  fs.mkdirSync(fixtureDir, { recursive: true });

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.join(fixtureDir, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content, "utf8");
  }

  return fixtureDir;
};

export const cleanupFixture = (fixtureDir: string): void => {
  if (fs.existsSync(fixtureDir)) {
    fs.rmSync(fixtureDir, { recursive: true, force: true });
  }
};

export const getDistRegisterPath = (): string => {
  return path.resolve(process.cwd(), "dist/cjs/register.js");
};

export const runWithDistRegister = ({
  cwd,
  entry,
  nodeArgs = [],
  timeoutMs = DEFAULT_TIMEOUT_MS,
}: RuntimeExecOptions): RuntimeResult => {
  const registerPath = getDistRegisterPath();
  const run = spawnSync("node", ["-r", registerPath, entry, ...nodeArgs], {
    cwd,
    encoding: "utf8",
    timeout: timeoutMs,
  });

  return {
    status: run.status,
    stdout: run.stdout ?? "",
    stderr: run.stderr ?? "",
    error: run.error ?? undefined,
  };
};
