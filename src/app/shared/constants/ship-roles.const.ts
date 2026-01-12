export interface CategoryConfig {
  label: string;
  icon: string;
  color?: string;
}

export const SHIP_ROLE_CONFIG: Record<string, CategoryConfig> = {
  warship: { label: 'Warship', icon: '⚔️', color: 'rgba(244, 67, 54, 0.35)' },
  freighter: { label: 'Freighter', icon: '📦', color: 'rgba(255, 193, 7, 0.35)' },
  utility: { label: 'Utility', icon: '⚙️', color: 'rgba(33, 150, 243, 0.35)' },
  miner: { label: 'Miner', icon: '⛏️', color: 'rgba(121, 85, 72, 0.35)' },
  starbase: { label: 'Starbase', icon: '🏯', color: 'rgba(96, 125, 139, 0.35)' },
  bomber: { label: 'Bomber', icon: '💣', color: 'rgba(255, 87, 34, 0.35)' },
  'mine-layer': { label: 'Mine Layer', icon: '🔆', color: 'rgba(233, 30, 99, 0.35)' },
};

export function getDisplayCategory(type: string): string {
  return type;
}
