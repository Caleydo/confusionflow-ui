/**
 * Created by Martin on 13.02.2018.
 */
import {ITable} from 'phovea_core/src/table';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';

export class DataStore {
  static singleSelected: IMalevoEpochInfo = null;
  static multiSelected: IMalevoEpochInfo[] = [];
  static labels:ITable = null;
  static selectedDataset:MalevoDataset = null;

  static justOneEpochSelected() {
    return DataStore.singleSelected !== null && DataStore.multiSelected.length === 0;
  }

  static rangeSelected() {
    return DataStore.singleSelected === null && DataStore.multiSelected.length !== 0;
  }

  static singleAndRangeSelected() {
    return DataStore.singleSelected !== null && DataStore.multiSelected.length !== 0;
  }

  static clearSelection() {
    DataStore.singleSelected = null;
    DataStore.clearMultiSelection();
  }

  static clearMultiSelection() {
    DataStore.multiSelected = [];
  }
}
