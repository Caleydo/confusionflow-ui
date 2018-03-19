import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';

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
export class MalevoDataset {
  name: string;
  epochInfos: IMalevoEpochInfo[];
  classLabels: ITable;
  loadedMalevoEpochs: ILoadedMalevoEpoch[];
  loadedClassLabels: string[];
}

/**
 * A collection of multiple datasets
 */
export interface IMalevoDatasetCollection {
  [key: string]: MalevoDataset;
}

export interface ILoadedMalevoEpoch {
  name: string;
  confusionData: number[][];
}
