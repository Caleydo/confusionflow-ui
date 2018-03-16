/**
 * Created by Martin on 13.02.2018.
 */
import {ITable} from 'phovea_core/src/table';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, min, NumberMatrix} from './DataStructures';

/**
 * Stores the selected datasets
 */
export class DataStoreDatasetSelection {
  static datasets: MalevoDataset[] = [];

  static datasetAdded(ds: MalevoDataset) {
    DataStoreDatasetSelection.datasets.push(ds);
    events.fire(AppConstants.EVENT_DATA_SET_ADDED, ds);
  }

  static datasetRemoved(ds: MalevoDataset) {
    DataStoreDatasetSelection.datasets = DataStoreDatasetSelection.datasets.filter((x) => x !== ds);
    events.fire(AppConstants.EVENT_DATA_SET_REMOVED, ds);
  }
}

/**
 * Stores selection from dataset/run selector and timeline
 */
export class DataStoreEpochSelection {
  static singleSelected: IMalevoEpochInfo = null;
  static multiSelected: IMalevoEpochInfo[] = [];
  static labels:ITable = null;
  static datasetName:string = null;

  static isJustOneEpochSelected(): boolean {
    return DataStoreEpochSelection.singleSelected !== null && DataStoreEpochSelection.multiSelected.length === 0;
  }

  static isRangeSelected(): boolean {
    return DataStoreEpochSelection.singleSelected === null && DataStoreEpochSelection.multiSelected.length !== 0;
  }

  static isSingleAndRangeSelected(): boolean {
    return DataStoreEpochSelection.singleSelected !== null && DataStoreEpochSelection.multiSelected.length !== 0;
  }

  static clearSelection() {
    DataStoreEpochSelection.clearSingleSelection();
    DataStoreEpochSelection.clearMultiSelection();
  }

  static clearMultiSelection() {
    DataStoreEpochSelection.multiSelected = [];
  }

  static clearSingleSelection() {
    DataStoreEpochSelection.singleSelected = null;
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
  static singleEpochIndex = -1;

  static lineCellSelected(rowIndex: number, colIndex: number, multiEpochData: Matrix<IClassEvolution>, singleEpochData: SquareMatrix<number>,
                          singleEpochIndex: number, labels: [number, string], type: string) {
    DataStoreCellSelection.rowIndex = rowIndex;
    DataStoreCellSelection.colIndex = colIndex;
    DataStoreCellSelection.singleEpochData = singleEpochData;
    DataStoreCellSelection.multiEpochData = multiEpochData;
    DataStoreCellSelection.singleEpochIndex = singleEpochIndex;
    DataStoreCellSelection.labels = labels;
    DataStoreCellSelection.type = type;
    events.fire(DataStoreCellSelection.type);
  }

  static deselectAllCells() {
    //todo just store the current selected node and deselect just this oneö
    const $allCells = DataStoreCellSelection.$grid.selectAll('.cell');
    $allCells.classed('selected', false);
  }

  static isMatrixCell() {
    return DataStoreCellSelection.type === AppConstants.SINGLE_LINE_MATRIX_CELL ||
      DataStoreCellSelection.type === AppConstants.COMBINED_MATRIX_CELL;
  }

  static isFPCell() {
    return DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_FP ||
      DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FP;
  }

  static isFNCell() {
    return DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_FN ||
      DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FN;
  }

  static isPrecisionCell() {
    return DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_PRECISION ||
      DataStoreCellSelection.type === AppConstants.SINGLE_LINE_PRECISION;
  }
}
