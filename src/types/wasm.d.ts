// src/types/wasm.d.ts

/**
 * Global declaration to allow importing .wasm files in TypeScript.
 * This treats the imported wasm binary as an opaque module that can be 
 * used with WebAssembly.instantiate() or handled by the bundler.
 */
declare module "*.wasm" {
  const value: any;
  export default value;
}

/**
 * Optional: Typing for Emscripten-generated "Glue" code.
 * If your C++ engine exports specific functions, you can define them here
 * to get full IntelliSense in your Next.js components.
 */
declare module "@engine/*" {
  interface WasmModule {
    solve: (data: string) => string;
    // Add other C++ exported functions here
  }
  const factory: () => Promise<WasmModule>;
  export default factory;
}