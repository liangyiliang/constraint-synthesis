import { Instance } from '../../../model_instance/Instance';

export type InstanceDiagramPair = {
  instance: Instance;
  diag: AbstractDiagram;
};

export type Pos = {
  x: number;
  y: number;
};

export type AbstractDiagram = Record<string, Pos>;
