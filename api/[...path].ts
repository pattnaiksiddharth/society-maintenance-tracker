import { app } from '../server/app.js';
import { connectDB } from '../server/db.js';

let dbPromise: Promise<unknown> | null = null;

export default async function handler(req: any, res: any) {
  try {
    if (!dbPromise) {
      dbPromise = connectDB();
    }

    await dbPromise;

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API]', error);

    return res.status(500).json({
      error: 'Server failed to initialize',
    });
  }
}