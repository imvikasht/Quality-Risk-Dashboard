import express from 'express';
import cors from 'cors';
import path from 'path';
import apiRoutes from './routes/api';
import { dataService } from './services/dataService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize data and start server
async function startServer() {
  try {
    // Initial data load from Excel files
    console.log('Initializing data service...');
    await dataService.load();

    if (process.env.VERCEL) {
      console.log('Running in Vercel environment.');
      return;
    }

    app.listen(PORT, () => {
      console.log(`\n🚀 Backend server running at http://localhost:${PORT}`);
      console.log(`Test API: http://localhost:${PORT}/api/summary`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    if (!process.env.VERCEL) {
      process.exit(1);
    }
  }
}

startServer();

export default app;
