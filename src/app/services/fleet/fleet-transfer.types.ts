export interface TransferSpec {
  ships: { designId: string; count: number; damage?: number }[];
  fuel: number;
  cargo: {
    resources: number;
    ironium: number;
    boranium: number;
    germanium: number;
    colonists: number;
  };
}
