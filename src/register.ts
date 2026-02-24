import { registerRTS } from "./index";

const args = process.argv.slice(2);
const format = args.includes("--format=cjs") ? "commonjs" : "esm";
registerRTS({
  module: format,
});
