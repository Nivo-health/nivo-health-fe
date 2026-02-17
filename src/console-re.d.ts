// console-re.d.ts
declare global {
  interface Console {
    re: {
      log: (...args: any[]) => void;
      info: (...args: any[]) => void;
      warn: (...args: any[]) => void;
      error: (...args: any[]) => void;
      // optionally add other methods you use
    };
  }
}

// This line makes sure TS treats this file as a module
export {};
