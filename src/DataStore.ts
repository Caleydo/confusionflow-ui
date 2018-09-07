/**
 * Created by Martin on 13.02.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import { AppConstants } from './AppConstants';
import { MatrixCell, PanelCell } from './confusion_matrix_cell/Cell';
import { ILoadedMalevoDataset, IMalevoEpochInfo, MalevoDataset } from './MalevoDataset';

export const dataStoreRuns: Map<string, DataStoreSelectedRun> = new Map<string, DataStoreSelectedRun>();

export class DataStoreLoadedRuns {
  static runs: ILoadedMalevoDataset[];
}

/**
 * Stores the selected runs
 * for a single epoch and for an epoch range
 */
export class DataStoreSelectedRun {
  singleSelected: IMalevoEpochInfo = null;
  multiSelected: IMalevoEpochInfo[] = [];

  static runIndexArray = Array(AppConstants.MAX_DATASET_COUNT).fill(null);
  color: string;

  /**
   * Returns an index that is currently not in use
   * @returns {number}
   */
  static getFreeIndex() {
    const index = DataStoreSelectedRun.runIndexArray.findIndex((x) => x === null);
    console.assert(index >= 0 && index < AppConstants.MAX_DATASET_COUNT);
    return index;
  }

  static setSelectionIndex(index: number, run: DataStoreSelectedRun) {
    DataStoreSelectedRun.runIndexArray[index] = run;
  }

  /**
   * Initializes colors for each run
   * @returns {Array}
   */
  static getColors(): string[] {
    const colorScale = d3.scale.category10();
    const colors = [];
    for (let i = 0; i < AppConstants.MAX_DATASET_COUNT; i++) {
      colors.push(colorScale(String(i)));
    }
    return colors;
  }

  constructor(public selectedDataset: MalevoDataset = null, public selectionIndex: number, public isLoading: boolean) {
    this.color = DataStoreSelectedRun.getColors()[selectionIndex];
  }

  /**
   * Creates a new run object, saves it in the collection
   * and fires the necessary events
   * @param ds
   */
  static add(ds: MalevoDataset) {
    const selectionIndex = DataStoreSelectedRun.getFreeIndex();
    const newRunObject = new DataStoreSelectedRun(ds, selectionIndex, true);
    DataStoreSelectedRun.setSelectionIndex(selectionIndex, newRunObject);
    dataStoreRuns.set(ds.name, newRunObject);
    DataStoreSelectedRun.updateRuns();
    events.fire(AppConstants.EVENT_DATA_SET_ADDED, ds);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  /**
   * Is called when a run has to be removed
   * This method is the counterpart to add()
   * @param ds
   */
  static remove(ds: MalevoDataset) {
    DataStoreSelectedRun.setSelectionIndex(dataStoreRuns.get(ds.name).selectionIndex, null);
    dataStoreRuns.delete(ds.name);
    if (dataStoreRuns.size === 0) {
      DataStoreCellSelection.deselect();
    }
    events.fire(AppConstants.EVENT_DATA_SET_REMOVED, ds);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  /**
   * Is called when the timeline is altered or when a new run is added
   */
  static updateRuns() {
    dataStoreRuns.forEach((timeline) => {
      timeline.multiSelected = timeline.selectedDataset.epochInfos.slice(TimelineParameters.minIndex, TimelineParameters.maxIndex + 1);
      timeline.singleSelected = timeline.selectedDataset.epochInfos[TimelineParameters.singleIndex];
    });
  }
}

/**
 * Stores the state of the timeline
 */
export class TimelineParameters {
  static minIndex = -1;
  static maxIndex = -1;
  static singleIndex = -1;

  static setRange(minIndex: number, maxIndex: number) {
    TimelineParameters.minIndex = minIndex;
    TimelineParameters.maxIndex = maxIndex;
  }
}

/**
 * Stores confusion matrix single cell selection
 */
export class DataStoreCellSelection {
  private static cell: MatrixCell | PanelCell = null;

  /**
   * Is called when a run is removed
   */
  static deselect() {
    if (DataStoreCellSelection.cell !== null) {
      DataStoreCellSelection.cell.$node.classed('selected', false);
      DataStoreCellSelection.cell = null;
    }
  }

  /**
   * is called when a cell is selected
   * @param cell
   */
  static cellSelected(cell: MatrixCell | PanelCell) {
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

  static getCell(): MatrixCell | PanelCell {
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
  private static _isAbsolute = false;
  private static _weightFactor = 1;
  private static _renderMode: RenderMode = RenderMode.COMBINED;
  private static _selectedClassIndices: number[] = [];

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

  static get weightFactor(): number {
    return (this._weightFactor === 0) ? 0.00001 : this._weightFactor;
  }

  static set weightFactor(value: number) {
    this._weightFactor = 1 - value;
    events.fire(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.weightFactor);
  }

  static get switchToAbsolute(): boolean {
    return this._isAbsolute;
  }

  static set switchToAbsolute(val: boolean) {
    this._isAbsolute = val;
    events.fire(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.switchToAbsolute);
  }

  static get selectedClassIndices(): number[] {
    return this._selectedClassIndices;
  }

  static set selectedClassIndices(val: number[]) {
    this._selectedClassIndices = val;
    events.fire(AppConstants.EVENT_CLASS_INDICES_CHANGED, this.selectedClassIndices);
  }
}
