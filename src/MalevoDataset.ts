import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {SquareMatrix} from './DataStructures';

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
}

/**
 * A collection of multiple datasets
 */
export interface IMalevoDatasetCollection {
  [key: string]: MalevoDataset;
}

//todo add description
export interface ILoadedMalevoEpoch {
  name: string;
  confusionData: SquareMatrix<number>;
}

export interface ILoadedMalevoDataset {
  singleEpochData: ILoadedMalevoEpoch;
  multiEpochData: ILoadedMalevoEpoch[];
  labels: string[];
}
