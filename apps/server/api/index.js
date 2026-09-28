import app from '../app.js';
import connectDB from '../src/shared/config/db.js';

/**
 * Vercel Serverless Function Handler
 * Wraps Express application with cached database connection.
 */
export default async function handler(req, res) {
  // FAST-PATH: Answer CORS preflight immediately without waiting for DB pool
  if (req.method === 'OPTIONS') {
    return app(req, res);
  }

  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel handler:', err);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }

  return app(req, res);
}
