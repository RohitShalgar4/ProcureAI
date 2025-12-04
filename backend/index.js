import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./database/db.js";
import config from "./config/config.js";
import proposalRoutes from "./routes/proposalRoutes.js";
import vendorRoutes from "./routes/vendorRoutes.js";
import rfpRoutes from "./routes/rfpRoutes.js";
import EmailPollingService from "./services/EmailPollingService.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Load environment variables
dotenv.config();

// Validate configuration
try {
  config.validate();
} catch (error) {
  console.error('Configuration Error:', error.message);
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();

const PORT = config.port;

// CORS Configuration
const corsOptions = {
  origin: config.frontendUrl,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'RFP Management System API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/proposals', proposalRoutes);
app.use('/api/rfps', rfpRoutes);
app.use('/api/vendors', vendorRoutes);

// Initialize email polling service (optional - can be enabled via environment variable)
const emailPollingService = new EmailPollingService();

if (process.env.ENABLE_EMAIL_POLLING === 'true') {
  const pollingInterval = parseInt(process.env.EMAIL_POLLING_INTERVAL) || 5;
  emailPollingService.start(pollingInterval);
  console.log('Email polling enabled');
} else {
  console.log('Email polling disabled (set ENABLE_EMAIL_POLLING=true to enable)');
}

// Manual email fetch endpoint (for testing)
app.post('/api/email/fetch', async (_req, res) => {
  try {
    const result = await emailPollingService.fetchNow();
    res.status(200).json({
      message: 'Email fetch triggered',
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      error: {
        message: 'Failed to fetch emails',
        details: error.message,
      },
    });
  }
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  emailPollingService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  emailPollingService.stop();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server listening at port ${PORT}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`CORS enabled for: ${config.frontendUrl}`);
});