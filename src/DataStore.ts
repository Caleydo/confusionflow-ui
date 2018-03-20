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

  static datasetAdded(ds: MalevoDataset) {
    events.fire(AppConstants.EVENT_DATA_SET_ADDED, ds);
  }

  static datasetRemoved(ds: MalevoDataset) {
    events.fire(AppConstants.EVENT_DATA_SET_REMOVED, ds);
  }
}

/**
 * Stores selection from dataset/run selector and timeline
 */
export class DataStoreTimelineSelection {
  singleSelected: IMalevoEpochInfo = null;
  multiSelected: IMalevoEpochInfo[] = [];
  selectedDataset:MalevoDataset = null;

  isJustOneEpochSelected(): boolean {
    return this.singleSelected !== null && this.multiSelected.length === 0;
  }

  isRangeSelected(): boolean {
    return this.singleSelected === null && this.multiSelected.length !== 0;
  }

  isSingleAndRangeSelected(): boolean {
    return this.singleSelected !== null && this.multiSelected.length !== 0;
  }

  clearSelection() {
    this.clearSingleSelection();
    this.clearMultiSelection();
  }

  clearMultiSelection() {
    this.multiSelected = [];
  }

  clearSingleSelection() {
    this.singleSelected = null;
  }

  isFullRangeSelected() {
    if(this.selectedDataset === null || this.multiSelected === []) {
      return false;
    }
    return this.selectedDataset.epochInfos.length === this.multiSelected.length;
  }
}

/**
 * Stores confusion matrix single cell selection
 */
export class DataStoreCellSelection {
  static $grid: d3.Selection<any>;

  static rowIndex = -1;
  static colIndex = -1;
  //todo the cell should store its epoch data and just use cell id here
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

export const dataStoreTimelines:Map<String, DataStoreTimelineSelection> = new Map<String, DataStoreTimelineSelection>();
