import { app } from '../server.ts';
import { connectDB } from '../server/db.ts';

let dbPromise = null;

export default async function handler(req, res) {
  if (!dbPromise) {
    dbPromise = connectDB();
  }

  await dbPromise;

  return app(req, res);
}
