import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {text} from 'd3';
import {IDecorator} from 'typedoc/dist/lib/models';
import {Barchart} from './Barchart';

type Matrix = [[number, number]];

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $panelRight: d3.Selection<any>;

  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('matrix-wrapper', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ConfusionMatrix>}
   */
  init() {
    this.attachListeners();
    this.setupLayout();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private setupLayout() {
    this.$node.append('div')
      .classed('button', true);

    this.$node.append('div')
      .classed('header', true)
      .classed('barstyle', true)
      .text('Predicted');

    this.$node.append('div')
      .classed('cell-empty', true);

    this.$node.append('div')
      .classed('left', true)
      .classed('barstyle', true)
      .text('Actual');

    this.$panelRight = this.$node.append('div')
      .classed('bars-right', true)
      .classed('l', true);
    this.$panelRight.append('div')
      .text('FP');

    this.$node.append('div')
      .classed('bars-bottom', true);

    this.$confusionMatrix = this.$node.append('div')
      .classed('confusion-matrix', true);

    this.$node.append('div')
      .classed('cell-empty2', true);

    this.$node.append('div')
      .classed('cell-empty3', true);
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

  private loadLabels(table: ITable) : Promise<any> {
    return table.data()
      .then((x) => {
        return x;
    });
  }

  private renderPanelRight(data: Matrix) {
    const aggrMatrix = data.map((row) => {
      return row;
    });

    aggrMatrix.unshift([0, 0]); // add dummy data for the label

    const $cells = this.$panelRight
      .selectAll('div')
      .data(aggrMatrix);

    $cells
      .enter()
      .append('div');

    $cells.each((d, i) => {
        if(i === 0) {
          return;
        }
        d[i-1] = 0;
        const bc = new Barchart(d3.select($cells[0][i]), d);
        bc.render();

      });

    $cells
      .exit()
      .remove();

  }

  private updateSingleEpoch(item:INumericalMatrix, classLabels: ITable) {
    const confusionData = this.loadConfusionData(item);
    const labels = this.loadLabels(classLabels);

    Promise.all([confusionData, labels]).then((x:any) => {
      this.renderSingleEpoch(x[0], x[1]);
      this.renderPanelRight(x[0]);
    });
  }

  private addRowAndColHeader(data: Matrix, labels: [number, String]):Matrix {
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
    return <Matrix>res;
  }

  private renderSingleEpoch(data: Matrix, labels: [number, String]) {
    if(!data) {
      return;
    }
    const ROW_COUNT = data.length;
    const rowHeaderPredicate = (datum: any, index: number) => {return index > 0 && index <= ROW_COUNT;};
    const colHeaderPredicate = (datum: any, index: number) => {return index > 0 && index % (ROW_COUNT + 1) === 0;};
    if(ROW_COUNT !== labels.length) {
      throw new TypeError('The length of the labels does not fit with the matrix length');
    }

    const matrix = this.addRowAndColHeader(data, labels);
    const data1D = [].concat(...matrix);

    const heatmapColorScale = d3.scale.linear().domain([0, this.findMaxValue(data)])
      .range((<any>['white', 'yellow']))
      .interpolate(<any>d3.interpolateHcl);

    const classColors = d3.scale.category10();

    const $cells = this.$confusionMatrix.selectAll('div')
      .data(data1D);
    $cells.enter().append('div')
      .classed('row-header', rowHeaderPredicate)
      .classed('col-header', colHeaderPredicate);
    $cells
      .text((datum: any, index: number, outerIndex: number) => {
        return datum;
      })
      .style('background-color', ((datum: any, index: number) => {
        if(rowHeaderPredicate(datum, index) || colHeaderPredicate(datum, index)) {
          return classColors(String(index));
        } else {
          return heatmapColorScale(datum);
        }
      }));

    $cells.exit().remove();
  }

  findMaxValue(matrix: Matrix):number {
    const aggrCols = new Array(10).fill(0);
    for(let i = 0; i < matrix.length; i++) {
      aggrCols[i] = Math.max(...matrix[i]);
    }
    return Math.max(...aggrCols);
  }
}

interface IRightDecorator {
  render();
}

class BarchartColumn {
  constructor(matrix: ConfusionMatrix) {

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
