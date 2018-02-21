/**
 * Created by Martin on 13.02.2018.
 */
import {ITable} from 'phovea_core/src/table';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, min, NumberMatrix} from './DataStructures';

export class DataStoreEpoch {
  static singleSelected: IMalevoEpochInfo = null;
  static multiSelected: IMalevoEpochInfo[] = [];
  static labels:ITable = null;
  static selectedDataset:MalevoDataset = null;

  static isJustOneEpochSelected(): boolean {
    return DataStoreEpoch.singleSelected !== null && DataStoreEpoch.multiSelected.length === 0;
  }

  static isRangeSelected(): boolean {
    return DataStoreEpoch.singleSelected === null && DataStoreEpoch.multiSelected.length !== 0;
  }

  static isSingleAndRangeSelected(): boolean {
    return DataStoreEpoch.singleSelected !== null && DataStoreEpoch.multiSelected.length !== 0;
  }

  static clearSelection() {
    DataStoreEpoch.clearSingleSelection();
    DataStoreEpoch.clearMultiSelection();
  }

  static clearMultiSelection() {
    DataStoreEpoch.multiSelected = [];
  }

  static clearSingleSelection() {
    DataStoreEpoch.singleSelected = null;
  }

  static isFullRangeSelected() {
    if(DataStoreEpoch.selectedDataset === null || DataStoreEpoch.multiSelected === []) {
      return false;
    }
    return DataStoreEpoch.selectedDataset.epochInfos.length === DataStoreEpoch.multiSelected.length;
  }
}

export class DataStoreCellSelection {
  static rowIndex = -1;
  static colIndex = -1;
  static multiEpochData: SquareMatrix<IClassEvolution>;
  static singleEpochData: SquareMatrix<number>;
  static labels: [number, string];

  static combinedEpochCellSelected(rowIndex: number, colIndex: number, multiEpochData: SquareMatrix<IClassEvolution>, singleEpochData: SquareMatrix<number>,
                                   labels: [number, string]) {
    DataStoreCellSelection.rowIndex = rowIndex;
    DataStoreCellSelection.colIndex = colIndex;
    DataStoreCellSelection.singleEpochData = singleEpochData;
    DataStoreCellSelection.multiEpochData = multiEpochData;
    DataStoreCellSelection.labels = labels;
    events.fire(AppConstants.COMBINED_EPOCH_CELL);
  }

  static lineChartCellSelected(rowIndex: number, colIndex: number, multiEpochData: SquareMatrix<IClassEvolution>, labels: [number, string])  {
    DataStoreCellSelection.rowIndex = rowIndex;
    DataStoreCellSelection.colIndex = colIndex;
    DataStoreCellSelection.multiEpochData = multiEpochData;
    DataStoreCellSelection.labels = labels;
    events.fire(AppConstants.MULTI_EPOCH_CELL);
  }

}
