import { FleetOrder } from '../../../../models/game.model';
import { GalaxyCoordinate } from '../../../../models/service-interfaces.model';

export interface WaypointSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  distance: number;
  type: FleetOrder['type'];
  order: FleetOrder;
  color: string;
  warning?: string;
}

export interface FleetWaypoints {
  fleetId: string;
  segments: WaypointSegment[];
  lastPos: GalaxyCoordinate;
}

export interface DraggedWaypoint {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  fleetId: string;
  orderIndex?: number;
}

export interface SnapTarget {
  type: 'star' | 'fleet' | 'space';
  id?: string;
  x: number;
  y: number;
}

export interface FinalizeWaypointResult {
  fleetId: string;
  orderIndex: number;
  order: FleetOrder;
}
