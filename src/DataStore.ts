/**
 * Created by Martin on 13.02.2018.
 */
import {ITable} from 'phovea_core/src/table';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, min, NumberMatrix} from './DataStructures';
import {ACell} from './confusion_matrix_cell/Cell';

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
  selectedDataset: MalevoDataset = null;
  datasetColor: string;
  indexInTimelineCollection = -1;

  clearMultiSelection() {
    this.multiSelected = [];
  }

  clearSingleSelection() {
    this.singleSelected = null;
  }
}

/**
 * Stores confusion matrix single cell selection
 */
export class DataStoreCellSelection {
  private static cell: ACell = null;

  static cellSelected(cell: ACell) {
    if (!cell) {
      return;
    }
    if (DataStoreCellSelection.cell !== null) {
      DataStoreCellSelection.cell.$node.classed('selected', false);
    }
    DataStoreCellSelection.cell = cell;
    DataStoreCellSelection.cell.$node.classed('selected', true);
    events.fire(AppConstants.EVENT_CELL_SELECTED);
  }

  static getCell(): ACell {
    return DataStoreCellSelection.cell;
  }
}

export enum RenderMode {
  CLEAR = 0,
  SINGLE = 1,
  MULTI = 2,
  COMBINED = 3
}

/**
 * Stores every property that is modifiable by the user
 */
export class DataStoreApplicationProperties {
  private static _transposeCellRenderer = false;
  private static _switchCellRenderer = false;
  private static _switchToAbsolute = false;
  private static _weightFactor = 1;
  private static _renderMode: RenderMode = RenderMode.COMBINED;

  static get renderMode(): RenderMode {
    return this._renderMode;
  }

  static set renderMode(value: RenderMode) {
    this._renderMode = value;
  }

  static get transposeCellRenderer(): boolean {
    return this._transposeCellRenderer;
  }

  static set transposeCellRenderer(value: boolean) {
    this._transposeCellRenderer = value;
    events.fire(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, this.transposeCellRenderer);
  }

  static toggleTransposeCellRenderer() {
    this._transposeCellRenderer = !this._transposeCellRenderer;
    events.fire(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, this.transposeCellRenderer);
  }

  static get switchCellRenderer(): boolean {
    return this._switchCellRenderer;
  }

  static set switchCellRenderer(value: boolean) {
    this._switchCellRenderer = value;
    events.fire(AppConstants.EVENT_CELL_RENDERER_CHANGED, this.switchCellRenderer);
  }

  static toggleSwitchCellRenderer() {
    this._switchCellRenderer = !this._switchCellRenderer;
    events.fire(AppConstants.EVENT_CELL_RENDERER_CHANGED, this.switchCellRenderer);
  }

  static get weightFactor(): number {
    return (this._weightFactor === 0) ? 0.00001 : this._weightFactor;
  }

  static set weightFactor(value: number) {
    this._weightFactor = 1 - value;
    events.fire(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.weightFactor);
  }

  static get switchToAbsolute(): boolean {
    return this._switchToAbsolute;
  }

  static set switchToAbsolute(val: boolean) {
    this._switchToAbsolute = val;
    events.fire(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.switchToAbsolute);
  }
}

export const dataStoreTimelines: Map<String, DataStoreTimelineSelection> = new Map<String, DataStoreTimelineSelection>();
