declare module 'mongo-sanitize' {
  function sanitize<T>(obj: T): T;
  export = sanitize;
} 