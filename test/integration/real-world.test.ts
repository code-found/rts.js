import test from "ava";
import fs from "fs";
import os from "os";
import path from "path";
import { transformer } from "../../src/resolver/transformer";

const PROJECT_ROOT = process.cwd();

/**
 * Setup temp directory for tests
 */
function setupTempDir(testName: string): string {
  const tempDir = path.join(os.tmpdir(), `rts-integration-${testName}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

/**
 * Cleanup temp directory
 */
function cleanupTempDir(tempDir: string): void {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * Transform TypeScript code and return result
 */
function transformCode(code: string, filename: string): string {
  const result = transformer.transformSync(Buffer.from(code), filename, {
    target: "es2022",
    module: "commonjs",
  });
  return result.code.toString();
}

// ============================================================================
// Integration Tests: Test actual TypeScript to JavaScript transformation
// ============================================================================

/**
 * Test: Should correctly transform TypeScript with imports
 */
test("should transform TypeScript with imports", (t) => {
  const code = `
import { add } from "./math";
const result = add(1, 2);
`;

  const result = transformCode(code, "test.ts");

  t.false(
    result.includes("import { add }"),
    "Should transform import statements",
  );
  t.true(result.includes("require"), "Should convert to require()");
});

/**
 * Test: Should transform arrow functions correctly
 */
test("should transform arrow functions correctly", (t) => {
  const code = `
const add = (a: number, b: number): number => a + b;
const result = add(1, 2);
`;

  const result = transformCode(code, "test.ts");

  t.false(result.includes(": number"), "Should remove type annotations");
  t.true(result.includes("=>"), "Should preserve arrow functions");
});

/**
 * Test: Should transform interfaces correctly
 */
test("should transform interfaces correctly", (t) => {
  const code = `
interface Person {
  name: string;
  age: number;
}

const person: Person = { name: "Alice", age: 30 };
console.log(person.name);
`;

  const result = transformCode(code, "test.ts");

  t.false(
    result.includes("interface Person"),
    "Should remove interface declarations",
  );
  t.false(
    result.includes("name: string"),
    "Should remove property type annotations",
  );
  t.true(result.includes("person.name"), "Should preserve actual code");
});

/**
 * Test: Should transform generic types correctly
 */
test("should transform generic types correctly", (t) => {
  const code = `
function identity<T>(arg: T): T {
  return arg;
}

const result = identity<string>("hello");
`;

  const result = transformCode(code, "test.ts");

  t.false(result.includes("<T>"), "Should remove generic syntax");
  t.true(result.includes("hello"), "Should preserve actual values");
});

/**
 * Test: Should transform async/await correctly
 */
test("should transform async/await correctly", (t) => {
  const code = `
async function fetchData(): Promise<string> {
  return "data";
}

async function main() {
  const data = await fetchData();
  console.log(data);
}
`;

  const result = transformCode(code, "test.ts");

  t.true(result.includes("async"), "Should preserve async");
  t.true(result.includes("await"), "Should preserve await");
  // Note: Promise type annotation is removed, but Promise is still used
  t.false(
    result.includes("Promise<string>"),
    "Should remove generic type annotation",
  );
});

/**
 * Test: Should transform class with decorators
 */
test("should transform class with decorators", (t) => {
  const code = `
function decorator(target: any) {
  return target;
}

@decorator
class MyClass {
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}
`;

  // Note: Legacy decorators are not supported by default
  // This should throw or transform with error
  t.throws(() => transformCode(code, "test.ts"));
});

/**
 * Test: Should handle complex nested imports
 */
test("should handle complex nested imports", (t) => {
  const code = `
import { a } from "./a";
import { b } from "./b";
import { c } from "./c";

const result = a + b + c;
`;

  const result = transformCode(code, "test.ts");

  // Should transform all imports
  t.false(result.includes('from "./a"'), "Should transform import a");
  t.false(result.includes('from "./b"'), "Should transform import b");
  t.false(result.includes('from "./c"'), "Should transform import c");
});

/**
 * Test: Should handle export statements
 */
test("should handle export statements", (t) => {
  const code = `
export const add = (a: number, b: number): number => a + b;
export class Calculator {
  multiply(a: number, b: number): number {
    return a * b;
  }
}
`;

  const result = transformCode(code, "test.ts");

  // ESM to CommonJS transformation
  t.true(result.includes("__esModule"), "Should add __esModule marker");
  t.true(result.includes("get add"), "Should export add using getter");
  t.true(
    result.includes("get Calculator"),
    "Should export Calculator using getter",
  );
});

/**
 * Test: Should handle destructuring assignments
 */
test("should handle destructuring assignments", (t) => {
  const code = `
const obj = { x: 1, y: 2 };
const { x, y } = obj;

const arr = [1, 2, 3];
const [first, second] = arr;
`;

  const result = transformCode(code, "test.ts");

  t.false(result.includes(": number"), "Should remove type annotations");
  t.true(result.includes("x, y"), "Should preserve destructuring");
  t.true(
    result.includes("first, second"),
    "Should preserve array destructuring",
  );
});

/**
 * Test: Should transform template literals
 */
test("should transform template literals", (t) => {
  const code = `
const name = "World";
const message = \`Hello, \${name}!\`;
const multi = \`
  line1
  line2
\`;
`;

  const result = transformCode(code, "test.ts");

  t.true(result.includes("`"), "Should preserve template literals");
  t.true(result.includes("\${name}"), "Should preserve template expressions");
});
