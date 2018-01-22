import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';

type Matrix = [[number, number]];

export class ConfusionMatrix implements IAppView {
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
    events.on(AppConstants.EVENT_EPOCH_SELECTED, (evt, items:IMalevoEpochInfo[], dataset:MalevoDataset) => {
      if(items.length === 0) {
        return;
      } else if(items.length === 1) {
        this.updateSingleEpoch(items[0].confusionInfo, dataset.classLabels);
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

  private loadLabels(table: ITable) {
    return table.data()
      .then((x) => {
        return x;
    });
  }

  private updateSingleEpoch(item:INumericalMatrix, classLabels: ITable) {
    const confusionData = this.loadConfusionData(item);
    const labels = this.loadLabels(classLabels);

    Promise.all([confusionData, labels]).then((x:any) => {
      this.renderSingleEpoch(x[0], x[1]);
    });
  }

  private addRowAndColHeader(data: Matrix, labels: [number, String]) {
    const size = data.length + 1;
    const res = [];
    for(let i = 0; i < size; i++) {
        res[i] = [];
      for(let j = 0; j < size; j++) {
        if(i === 0 && j === 0) {
          continue;
        }
        if(i === 0 && j < size) {
          res[0][j] = labels[j-1][1];
          continue;
        }
        if(j === 0 && i < size) {
          res[i][0] = labels[i-1][1];
          continue;
        }
        res[i][j] = data[i-1][j-1];
      }
    }
    return res;
  }

  private renderSingleEpoch(data: Matrix, labels: [number, String]) {
    if(!data) {
      return;
    }
    const ROW_COUNT = data.length;
    const rowHeaderPredicate = (datum: any, index: number, outerIndex: number) => {return index > 0 && index <= ROW_COUNT;};
    const colHeaderPredicate = (datum: any, index: number, outerIndex: number) => {return index > 0 && index % (ROW_COUNT + 1) === 0;};
    if(ROW_COUNT !== labels.length) {
      throw new TypeError('The length of the labels does not fit with the matrix length');
    }

    const matrix = this.addRowAndColHeader(data, labels);
    const data1D = [].concat(...matrix);

    const $cells = this.$node.selectAll('div')
      .data(data1D);
    const $cellsEnter = $cells.enter().append('div')
      .classed('row-header', rowHeaderPredicate)
      .classed('col-header', colHeaderPredicate);

    $cells
      .text((datum: any, index: number, outerIndex: number) => {
        return datum;
      });

    $cells.exit().remove();
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
