declare module '@/lib/mongodb' {
  export function connectToDatabase(): Promise<void>;
} 