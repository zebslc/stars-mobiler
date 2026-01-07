export interface Cost {
  resources: number;
  ironium?: number;
  boranium?: number;
  germanium?: number;
}

export const BUILD_COSTS: Record<string, Cost> = {
  mine: { resources: 5 },
  factory: { resources: 10, germanium: 4 },
  defense: { resources: 15, ironium: 2, boranium: 2 },
  research: { resources: 10 },
  terraform: { resources: 25, germanium: 5 },
  scanner: { resources: 50, ironium: 5, germanium: 10 },
};
