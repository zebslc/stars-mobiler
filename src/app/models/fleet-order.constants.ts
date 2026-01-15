export const FLEET_ORDER_TYPE = {
  MOVE: 'move',
  ORBIT: 'orbit',
  COLONIZE: 'colonize',
  ATTACK: 'attack',
} as const;

export type FleetOrderType = typeof FLEET_ORDER_TYPE[keyof typeof FLEET_ORDER_TYPE];
