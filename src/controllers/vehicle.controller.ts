import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { vehiclesTable, schedulesTable } from '../config/database';
import { logger } from '../middleware/logging.middleware';

export const registerVehicle = (req: Request, res: Response): void => {
  const { vin, model, currentMileage, serviceType, mileageInterval, daysInterval } = req.body;

  // 1. Validation checks
  if (!vin || !model) {
    res.status(400).json({ status: 'FAILED', message: 'Missing essential fields: vin and model are required.' });
    return;
  }

  // 2. Instantiate Vehicle record
  const newVehicle = {
    id: uuidv4(),
    vin,
    model,
    currentMileage: currentMileage || 0,
    status: 'ACTIVE' as const,
    createdAt: new Date()
  };
  vehiclesTable.push(newVehicle);

  // 3. Compute scheduling limits based on mathematical offsets
  const targetDueDate = new Date();
  targetDueDate.setDate(targetDueDate.getDate() + (daysInterval || 180)); // default to 6 months

  const initialSchedule = {
    id: uuidv4(),
    vehicleId: newVehicle.id,
    serviceType: serviceType || 'Standard Inspection & Oil Change',
    nextDueMileage: (currentMileage || 0) + (mileageInterval || 5000),
    nextDueDate: targetDueDate,
    status: 'PENDING' as const
  };
  schedulesTable.push(initialSchedule);

  res.status(201).json({
    status: 'SUCCESS',
    data: { vehicle: newVehicle, schedule: initialSchedule }
  });
};

export const updateTelemetry = (req: Request, res: Response): void => {
  const { id } = req.params;
  const { currentMileage } = req.body;

  if (currentMileage === undefined || currentMileage < 0) {
    res.status(400).json({ status: 'FAILED', message: 'Valid currentMileage value is required.' });
    return;
  }

  const vehicle = vehiclesTable.find((v) => v.id === id);
  if (!vehicle) {
    res.status(404).json({ status: 'FAILED', message: 'Target vehicle context not found.' });
    return;
  }

  // Mutate vehicle telemetry
  vehicle.currentMileage = currentMileage;

  logger.info({
    message: 'Telemetry updated for vehicle',
    vehicleId: id,
    newMileage: currentMileage,
    correlationId: req.headers['x-correlation-id']
  });

  res.status(200).json({
    status: 'SUCCESS',
    message: 'Vehicle data telemetry updated successfully.',
    data: { vehicle }
  });
};