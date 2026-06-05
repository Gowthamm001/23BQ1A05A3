import express from 'express';
import dotenv from 'dotenv';
import { loggingMiddleware } from './middleware/logging.middleware';
import { registerVehicle, updateTelemetry } from './controllers/vehicle.controller';
import { schedulerService } from './services/scheduler.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Stage 1: Global Structured Logging Layer
app.use(loggingMiddleware);

// Stage 2: Core Data Ingestion Endpoints
app.post('/api/v1/vehicles', registerVehicle);

// Updated background worker loop utilizing Stage 5 Distributed Locking
setInterval(async () => {
  const LOCK_KEY = 'cron:maintenance:evaluation';
  const lockAcquired = await redisLockManager.acquireLock(LOCK_KEY, 15000); // 15s TTL

  if (!lockAcquired) {
    logger.info({ message: 'Sync Lock Contention: Another server instance is already running the scheduler. Skipping loop.' });
    return;
  }

  try {
    schedulerService.checkMaintenanceAlerts();
  } finally {
    // Keep lock active for a short period to prevent instant re-execution spikes
  }
}, 30000);

// Modified Ingestion Route: Updates telemetry AND instantly runs Stage 3 scheduler verification
app.post('/api/v1/vehicles/:id/telemetry', (req, res, next) => {
  // Execute the standard update controller logic
  updateTelemetry(req, res);
  
  // Instantly invoke evaluation engine to catch threshold limits without waiting for background loops
  schedulerService.checkMaintenanceAlerts();
});

// Base System Status Probe
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'UP', stage: 3, engineState: 'ACTIVE' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Stage 3 Microservice initialized on port ${PORT}`);
    
    // Stage 3: Automated background worker daemon loop (Evaluates intervals every 30 seconds)
    setInterval(() => {
      schedulerService.checkMaintenanceAlerts();
    }, 30000);
  });
}

export default app;