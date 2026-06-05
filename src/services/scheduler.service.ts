import { vehiclesTable, schedulesTable } from '../config/database';
import { logger } from '../middleware/logging.middleware';

interface NotificationPayload {
  recipientId: string;
  category: string;
  priority: 'LOW' | 'HIGH';
  channels: ('EMAIL' | 'SMS' | 'PUSH')[];
  messageDetails: {
    model: string;
    vin: string;
    reason: string;
    currentMileage: number;
  };
}

export class SchedulerService {
  
  /**
   * Background Daemon Task: Evaluates all pending maintenance tracks
   * Formula: Current Mileage >= Next Due Mileage OR Current Date >= Next Due Date
   */
  public checkMaintenanceAlerts(): void {
    const today = new Date();
    
    schedulesTable.forEach((schedule) => {
      // Idempotency: Ignore rows that are already handled or running
      if (schedule.status !== 'PENDING') return;

      const vehicle = vehiclesTable.find((v) => v.id === schedule.vehicleId);
      if (!vehicle) return;

      // Mathematical condition evaluations
      const isMileageBreached = vehicle.currentMileage >= schedule.nextDueMileage;
      const isTimeBreached = today >= schedule.nextDueDate;

      if (isMileageBreached || isTimeBreached) {
        // Atomic status mutations to prevent duplicate processing
        schedule.status = 'OVERDUE';
        vehicle.status = 'MAINTENANCE_DUE';

        logger.warn({
          message: 'Vehicle maintenance limit breached!',
          vehicleId: vehicle.id,
          vin: vehicle.vin,
          reason: isMileageBreached ? 'Mileage Interval Met' : 'Time Interval Met',
          currentOdometer: vehicle.currentMileage,
          thresholdMileage: schedule.nextDueMileage
        });

        // Construct the asynchronous cross-service contract payload for the Notification App
        const alertPayload: NotificationPayload = {
          recipientId: 'FLEET_OPERATIONS_MANAGER',
          category: 'MAINTENANCE_ALERT',
          priority: 'HIGH',
          channels: ['EMAIL', 'PUSH'],
          messageDetails: {
            model: vehicle.model,
            vin: vehicle.vin,
            reason: schedule.serviceType,
            currentMileage: vehicle.currentMileage
          }
        };

        this.dispatchToNotificationApp(alertPayload);
      }
    });
  }

  /**
   * Simulates an asynchronous broker pipeline/HTTP post to your Notification App subsystem
   */
  private dispatchToNotificationApp(payload: NotificationPayload): void {
    logger.info({
      message: 'Routing alert message packet to Notification App consumer pool',
      recipientId: payload.recipientId,
      channels: payload.channels
    });

    // Console output block simulation representing real-time WebSockets / Workers delivery
    console.log(`\n📢 [NOTIFICATION APP DISPATCH] To: ${payload.recipientId}`);
    console.log(`✉️  [Channels]: ${payload.channels.join(' & ')}`);
    console.log(`⚠️  [Alert]: Unit ${payload.messageDetails.model} (VIN: ${payload.messageDetails.vin}) requires an immediate ${payload.messageDetails.reason}. Odometer: ${payload.messageDetails.currentMileage} mi.\n`);
  }
}

export const schedulerService = new SchedulerService();