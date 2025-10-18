/// <reference types="@cloudflare/workers-types" />

declare global {
  interface Env {
    TODOS?: KVNamespace;
    SCORES?: KVNamespace;
    // ASSETS is already available via generated types (worker-configuration.d.ts)
  }
}

export {};
