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
  selectedDataset:MalevoDataset = null;
  datasetColor: string;

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
  static cell: ACell;
  static cellSelected(cell: ACell) {
    this.cell = cell;
    events.fire(AppConstants.EVENT_SELL_SELECTED);
  }
}

export const dataStoreTimelines:Map<String, DataStoreTimelineSelection> = new Map<String, DataStoreTimelineSelection>();
