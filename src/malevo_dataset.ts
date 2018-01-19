import {INumericalMatrix} from 'phovea_core/src/matrix';

/**
 * Stores data of a single epoch
 */
export interface IMalevoEpochInfo {
  name: string;
  confusionInfo: INumericalMatrix;
}

/**
 * A whole dataset which consists of 1..n epochs
 */
export class IMalevoDataset {
  name: string;
  epochInfos: IMalevoEpochInfo[];
}

/**
 * A collection of multiple datasets
 */
export interface IMalevoDatasetCollection {
  [key: string]: IMalevoDataset;
}
