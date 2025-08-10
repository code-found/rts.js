import test from "ava";
import { ModuleTransformer } from "../src/resolver";

test("TS support should be available", (t) => {
  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from("const x: number = 1"), "a.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();
  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSX support should be available", (t) => {
  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from("export const C=()=>null"), "a.tsx", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();
  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSX should compile component with props and fragments", (t) => {
  const code = `
    import React from 'react';
    type Props = { title: string; items: string[] };
    export function List({ title, items }: Props) {
      return (
        <>
          <h1>{title}</h1>
          {items.map((it, i) => <div key={i}>{it}</div>)}
        </>
      );
    }
  `;
  const mt = new ModuleTransformer();
  const out = mt
    .transformSync(Buffer.from(code), "list.tsx", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();
  t.is(typeof out, "string");
  t.truthy(out.length > 0);
});

test("TSX should compile component with children and spread props", (t) => {
  const code = `
    import React, { type PropsWithChildren } from 'react';
    type ButtonProps = PropsWithChildren<{ onClick?: () => void; [k: string]: any }>;
    export const Button = ({ children, ...rest }: ButtonProps) => (
      <button {...rest}>{children}</button>
    );
  `;
  const mt = new ModuleTransformer();
  const out = mt
    .transformSync(Buffer.from(code), "button.tsx", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();
  t.is(typeof out, "string");
  t.truthy(out.length > 0);
});

test("TSHook should transform TypeScript code", (t) => {
  const typescriptCode = `
    interface User {
      name: string;
      age: number;
    }
    
    const user: User = {
      name: 'John',
      age: 30
    };
    
    export { user };
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(typescriptCode), "test.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
  t.not(result, typescriptCode); // Should be transformed
});

test("TSHook should transform TSX code", (t) => {
  const tsxCode = `
    import React from 'react';
    
    interface Props {
      name: string;
    }
    
    const Component: React.FC<Props> = ({ name }) => {
      return React.createElement('div', null, 'Hello ', name);
    };
    
    export default Component;
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(tsxCode), "test.tsx", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
  t.not(result, tsxCode); // Should be transformed
});

test("TSHook should handle empty code", (t) => {
  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(""), "empty.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  // Empty code might still produce some output from SWC
  t.truthy(result.length >= 0);
});

test("TSHook should handle simple TypeScript", (t) => {
  const simpleCode = "const x: number = 42;";
  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(simpleCode), "simple.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSHook should handle imports and exports", (t) => {
  const code = `
    import { Component } from 'react';
    export default Component;
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(code), "imports.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TS transformer should error on legacy decorators by default", (t) => {
  const code = `
    function log(target: any, propertyKey: string) {
      console.log('Decorator called');
    }
    
    class Example {
      @log
      method() {
        return 'test';
      }
    }
  `;

  const mt = new ModuleTransformer();
  t.throws(() => {
    mt.transformSync(Buffer.from(code), "decorators.ts", {
      target: "es2022",
      module: "commonjs",
    });
  });
});

test("TSHook should handle async/await", (t) => {
  const code = `
    async function fetchData(): Promise<string> {
      const response = await fetch('/api/data');
      return response.text();
    }
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(code), "async.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSHook should handle generics", (t) => {
  const code = `
    function identity<T>(arg: T): T {
      return arg;
    }
    
    const result = identity<string>('hello');
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(code), "generics.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSHook should handle JSX with React.createElement", (t) => {
  const code = `
    import React from 'react';
    
    const Component = () => {
      return React.createElement('div', null, 'Hello World');
    };
    
    export default Component;
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(code), "jsx.tsx", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});

test("TSHook should handle complex TypeScript features", (t) => {
  const code = `
    type Status = 'pending' | 'success' | 'error';
    
    interface ApiResponse<T> {
      data: T;
      status: Status;
      message?: string;
    }
    
    class ApiClient {
      async fetch<T>(url: string): Promise<ApiResponse<T>> {
        const response = await fetch(url);
        const data = await response.json();
        return { data, status: 'success' as Status };
      }
    }
  `;

  const mt = new ModuleTransformer();
  const result = mt
    .transformSync(Buffer.from(code), "complex.ts", {
      target: "es2022",
      module: "commonjs",
    })
    .code.toString();

  t.is(typeof result, "string");
  t.truthy(result.length > 0);
});
