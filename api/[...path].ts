import { app } from '../server/app.js';
import { connectDB } from '../server/db.js';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error('[Vercel API]', error);

    return res.status(500).json({
      error: 'Server failed to initialize',
    });
  }
}