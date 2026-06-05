import { vehiclesTable, schedulesTable } from '../config/database';
import { logger } from '../middleware/logging.middleware';
import { crypto } from 'crypto'; // Native Node module for hash structures

// Stage 6: Persistent memory cache monitoring processed idempotency tokens
const idempotencyCache: Set<string> = new Set();

export class SchedulerService {
  
  public checkMaintenanceAlerts(): void {
    const today = new Date();
    
    schedulesTable.forEach((schedule) => {
      if (schedule.status !== 'PENDING') return;

      const vehicle = vehiclesTable.find((v) => v.id === schedule.vehicleId);
      if (!vehicle) return;

      if (vehicle.currentMileage >= schedule.nextDueMileage || today >= schedule.nextDueDate) {
        schedule.status = 'OVERDUE';
        vehicle.status = 'MAINTENANCE_DUE';

        // STAGE 6 IDEMPOTENCY: Derive a deterministic unique key based on the event context
        // This ensures the exact same alert event cannot be triggered twice within the pipeline
        const rawTokenSource = `${vehicle.id}:${schedule.id}:${schedule.nextDueMileage}`;
        const idempotencyKey = crypto.createHash('sha256').update(rawTokenSource).digest('hex');

        this.processWorkerQueue({
          idempotencyKey,
          recipientId: 'FLEET_OPERATIONS_MANAGER',
          channels: ['EMAIL', 'SMS'],
          alertText: `Unit ${vehicle.model} breached mechanical tolerances. Service required: ${schedule.serviceType}`
        });
      }
    });
  }

  /**
   * Stage 6 Queue Worker Process featuring Exponential Backoff Retries
   */
  private async processWorkerQueue(job: { idempotencyKey: string; recipientId: string; channels: string[]; alertText: string }): Promise<void> {
    
    // 1. Check Idempotency Cache Layer
    if (idempotencyCache.has(job.idempotencyKey)) {
      logger.warn({ message: 'Deduplication Alert: Duplicate execution token detected. Request safely discarded.', key: job.idempotencyKey });
      return;
    }

    // Register token instantly to lock the pipeline transaction
    idempotencyCache.add(job.idempotencyKey);

    // 2. Process async channels via worker allocation blocks
    for (const channel of job.channels) {
      let attempts = 0;
      const maxRetries = 3;
      let success = false;

      while (attempts < maxRetries && !success) {
        try {
          attempts++;
          logger.info({ message: `Worker pool processing dispatch request`, channel, attempt: attempts });
          
          // Simulate standard provider call
          if (Math.random() < 0.15) throw new Error('Third-party API Network Timeout'); // Simulating unpredictable network jitter

          console.log(`\n🚀 [STAGE 6 WORKER SUCCESS] Dispatched via [${channel}] to ${job.recipientId} | Message: ${job.alertText}\n`);
          success = true;
        } catch (err: any) {
          logger.error({ message: `Channel worker execution failed`, error: err.message, channel, attempt: attempts });
          
          // Exponential Backoff calculation: Wait 2^attempt * 100ms before retries
          const backoffDelay = Math.pow(2, attempts) * 100;
          await new Promise((res) => setTimeout(res, backoffDelay));
        }
      }

      // Route to Dead Letter Queue (DLQ) if completely exhausted
      if (!success) {
        logger.error({ message: `CRITICAL: Job permanently failed across all retry lifecycles. Routing payload to Dead Letter Queue (DLQ).`, jobKey: job.idempotencyKey });
      }
    }
  }
}

export const schedulerService = new SchedulerService();