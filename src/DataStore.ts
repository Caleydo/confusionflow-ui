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

/**
 * Stores every property that is modifiable by the user
 */
export class DataStoreApplicationProperties {
  public static transposeCellRenderer = false;
  public static switchCellRenderer = false;
  private static _weightFactor = 1;

  public static get weightFactor(): number {
    return (this._weightFactor === 0) ? 0.00001 : this._weightFactor;
  }

  static toggleTransposeCellRenderer() {
    this.transposeCellRenderer = !this.transposeCellRenderer;
    events.fire(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, this.transposeCellRenderer);
  }

  static toggleSwitchCellRenderer() {
    this.switchCellRenderer = !this.switchCellRenderer;
    events.fire(AppConstants.EVENT_CELL_RENDERER_CHANGED, this.switchCellRenderer);
  }

  static updateWeightFactor(weightFactor: number) {
    this._weightFactor = 1 - weightFactor;
    events.fire(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.weightFactor);
  }
}

export const dataStoreTimelines: Map<String, DataStoreTimelineSelection> = new Map<String, DataStoreTimelineSelection>();
