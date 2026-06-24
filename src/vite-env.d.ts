/// <reference types="vite/client" />

// ---------------------------------------------------------------------------
// CSS module declarations
// ---------------------------------------------------------------------------
// Vite resolves CSS imports at runtime, but TypeScript needs a declaration
// for bare CSS imports (e.g. 'lenis/dist/lenis.css') to stop flagging them.
// This covers all .css imports project-wide.
declare module '*.css' {
  const styles: Record<string, string>;
  export default styles;
}