export interface Vehicle {
  id?: string;
  code: string;
  capacity: number;
  wheelchairSupported: boolean;
  status: string;
  currentLat?: number;
  currentLng?: number;
  active: boolean;
}

export interface VehicleLocation {
  vehicleId: string;
  code: string;
  currentLat: number;
  currentLng: number;
}

export interface TransportRequest {
  id?: string;
  scheduledSessionId: string;
  patientId: string;
  pickupZone: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  wheelchairRequired: boolean;
  status: string;
  shift?: string;
  priorityScore?: number;
  requestDate?: string;
}

export interface SharedRideGroup {
  id?: string;
  groupId: string;
  status: string;
  day: string;
  shift: string;
  pickupZone: string;
  pickupAddress?: string;
  pickupLat?: number;
  pickupLng?: number;
  compatibilityScore: number;
  vehicleCode?: string;
  transportRequests: TransportRequest[];
  vehicleId?: string;
  
  memberCount?: number;
  decisionType?: string;
  requiresWheelchair?: boolean;
}

export interface ReadinessScore {
  scheduledSessionId: string;
  readinessStatus: string;
  globalScore: number;
  blockingReason?: string;
  warningReason?: string;
}

export interface EscalationLog {
  id: string;
  scheduledSessionId: string;
  patientId: string;
  level: string;
  triggeredAt: string;
}
