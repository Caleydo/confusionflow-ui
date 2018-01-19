import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IMalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';

type ConfusionData = [number, number];

export class ConfusionMatrix implements IAppView{
  private readonly $node: d3.Selection<any>;


  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('confusion-matrix', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ConfusionMatrix>}
   */
  init() {
    this.attachListeners();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_EPOCH_SELECTED, (evt, items:IMalevoEpochInfo[]) => {
      if(items.length === 0) {
        return;
      } else if(items.length === 1) {
        this.updateSingleEpoch(items[0].confusionInfo);
      } else {
        // rendering epoch ranges goes here
      }

    });
  }

  private loadConfusionData(matrix: INumericalMatrix) : Promise<any> {
  return matrix.data()
    .then((x) => {
      return x;
    });
  }

  private updateSingleEpoch(item:INumericalMatrix) {
    this.loadConfusionData(item).then((data: ConfusionData) => {
      this.renderSingleEpoch(data);
    });
  }

  private renderSingleEpoch(data: ConfusionData) {
    if(!data) {
      return;
    }

    const data1D = [].concat(...data);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent:Element, options:any) {
  return new ConfusionMatrix(parent);
}
