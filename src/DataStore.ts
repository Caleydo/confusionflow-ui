/**
 * Created by Martin on 13.02.2018.
 */
import {ITable} from 'phovea_core/src/table';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, min, NumberMatrix} from './DataStructures';

/**
 * Stores selection from dataset/run selector and timeline
 */
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

/**
 * Stores confusion matrix single cell selection
 */
export class DataStoreCellSelection {
  static $grid: d3.Selection<any>;

  static rowIndex = -1;
  static colIndex = -1;
  static multiEpochData: Matrix<IClassEvolution> = null;
  static singleEpochData: Matrix<number> = null;
  static labels: [number, string];
  static type: string;

  static lineCellSelected(rowIndex: number, colIndex: number, multiEpochData: Matrix<IClassEvolution>, singleEpochData: SquareMatrix<number>,
                          labels: [number, string], type: string) {
    DataStoreCellSelection.rowIndex = rowIndex;
    DataStoreCellSelection.colIndex = colIndex;
    DataStoreCellSelection.singleEpochData = singleEpochData;
    DataStoreCellSelection.multiEpochData = multiEpochData;
    DataStoreCellSelection.labels = labels;
    DataStoreCellSelection.type = type;
    events.fire(DataStoreCellSelection.type);
  }

  static deselectAllCells() {
    //todo just store the current selected node and deselect just this oneö
    const $allCells = DataStoreCellSelection.$grid.selectAll('.cell');
    $allCells.classed('selected', false);
  }
}
