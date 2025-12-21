import dotenv from 'dotenv';
dotenv.config();

import express, { Application, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import authRoutes from './routes/auth';
import usageRoutes from './routes/usage';
import aiRoutes from './routes/ai';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://www.marinova.in/',
    'https://www.marinova.in',
    'https://marinova.in',
    'https://marinova-frontend.vercel.app/',
    'https://marinova-frontend.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware for debugging
app.use((req: Request, _res: Response, next: NextFunction): void => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// MongoDB Connection
// In serverless environments, handle connection gracefully
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is not set!');
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
} else {
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch((err: Error) => {
      console.error('❌ MongoDB connection error:', err);
      // Don't exit in production/serverless - let Vercel handle it
      if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  Continuing without MongoDB connection (serverless mode)');
      } else {
        process.exit(1);
      }
    });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint (doesn't require MongoDB)
app.get('/api/health', (_req: Request, res: Response): void => {
  const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    mongoStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server (only for local development)
// In production, Vercel will handle the serverless function
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, '0.0.0.0', (): void => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  });
} else {
  console.log('⚠️  Running in production mode - server will be handled by Vercel');
}

// Export for Vercel serverless
export default app;
