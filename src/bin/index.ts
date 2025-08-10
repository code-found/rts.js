#!/usr/bin/env node

import { spawn } from "child_process";
import { registerRTS } from "../index";

// Register RTS hooks when this module is loaded
registerRTS();

spawn(`node`, ["-r", "rts.js/register", ...process.argv.slice(2)], {
  cwd: process.cwd(),
  stdio: "inherit",
});
