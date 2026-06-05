export interface Vehicle {
  id: string;
  vin: string;
  model: string;
  currentMileage: number;
  status: 'ACTIVE' | 'MAINTENANCE_DUE' | 'UNDER_SERVICE';
  createdAt: Date;
}

export interface MaintenanceSchedule {
  id: string;
  vehicleId: string;
  serviceType: string;
  nextDueMileage: number;
  nextDueDate: Date;
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED';
}

// Global In-Memory Collections simulating active DB relations
export const vehiclesTable: Vehicle[] = [];
export const schedulesTable: MaintenanceSchedule[] = [];