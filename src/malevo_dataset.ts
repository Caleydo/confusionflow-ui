import {INumericalMatrix} from 'phovea_core/src/matrix';

export interface IMalevoEpochInfo {
  name: string;
  epochInfo: INumericalMatrix;
  confusionInfo: INumericalMatrix;
}

export class IMalevoDataset {
  name: string;
  epochInfos: IMalevoEpochInfo[];
}

export interface IMalevoDatasetCollection {
  [key: string]: IMalevoDataset;
}
