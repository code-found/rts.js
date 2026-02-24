import path from "node:path";
import { ModuleTransformer } from "t-packer";

class AwosomeTransformer extends ModuleTransformer {
  module: "esm" | "commonjs" = "commonjs";
  /**
   * Transform source code using registered transformers
   *
   * This method applies all registered transformers that match the file extension
   * in sequence. Each transformer receives the output of the previous transformer.
   *
   * @param code - The source code to transform
   * @param filename - The filename for context
   * @returns Transformed code, or empty string if no transformers match
   */
  transformCodeSync(
    code: string,
    filename: string,
  ): { code: string; format: "commonjs" | "esm" } {
    const format =
      this.module === "esm"
        ? /\.c[jt]sx?$/.test(filename)
          ? "commonjs"
          : "esm"
        : /\.m[jt]sx?$/.test(filename)
          ? "esm"
          : "commonjs";
    if (!this.transformers.has(path.extname(filename))) {
      return {
        code: "",
        format,
      };
    }
    const transformedCode = this.transformSync(Buffer.from(code), filename, {
      target: "es2022",
      module: format,
    }).code.toString();
    return { code: transformedCode, format };
  }
  async transformCode(
    code: string,
    filename: string,
  ): Promise<{ code: string; format: "commonjs" | "esm" }> {
    const format =
      this.module === "esm"
        ? /\.c[jt]sx?$/.test(filename)
          ? "commonjs"
          : "esm"
        : /\.m[jt]sx?$/.test(filename)
          ? "esm"
          : "commonjs";
    if (!this.transformers.has(path.extname(filename))) {
      return { code: "", format };
    }
    const result = await this.transform(Buffer.from(code), filename, {
      target: "es2022",
      module: format,
    });
    return {
      code: result.code.toString(),
      format,
    };
  }
}
export const transformer = new AwosomeTransformer();
