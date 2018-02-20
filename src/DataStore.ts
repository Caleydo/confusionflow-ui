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

  static isJustOneEpochSelected(): boolean {
    return DataStore.singleSelected !== null && DataStore.multiSelected.length === 0;
  }

  static isRangeSelected(): boolean {
    return DataStore.singleSelected === null && DataStore.multiSelected.length !== 0;
  }

  static isSingleAndRangeSelected(): boolean {
    return DataStore.singleSelected !== null && DataStore.multiSelected.length !== 0;
  }

  static clearSelection() {
    DataStore.clearSingleSelection();
    DataStore.clearMultiSelection();
  }

  static clearMultiSelection() {
    DataStore.multiSelected = [];
  }

  static clearSingleSelection() {
    DataStore.singleSelected = null;
  }

  static isFullRangeSelected() {
    if(DataStore.selectedDataset === null || DataStore.multiSelected === []) {
      return false;
    }
    return DataStore.selectedDataset.epochInfos.length === DataStore.multiSelected.length;
  }
}
