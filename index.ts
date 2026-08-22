import { app } from './server';
import { connectDB } from './server/db';

let dbPromise: Promise<unknown> | null = null;

export default async function handler(req: any, res: any) {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  await dbPromise;

  return app(req, res);
}