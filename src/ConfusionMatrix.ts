import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {NumberMatrix, SquareMatrix, maxValue, transform} from './DataStructures';
import {BarchartCellRenderer, HeatCellRenderer} from './CellRenderer';

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: ChartColumn;
  private fnColumn: ChartColumn;
  private accuracyColumn: ChartColumn;

  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('grid', true);
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
      .classed('axis', true)
      .classed('axis-top', true)
      .text('Predicted');

    this.$node.append('div')
      .classed('axis', true)
      .classed('axis-left', true)
      .text('Ground Truth');

    const $labelRight = this.$node.append('div')
      .classed('label-right', true);
    $labelRight.append('div')
      .text('FP');
    $labelRight.append('div')
      .text('Accuracy');

    this.$node.append('div')
      .classed('label-bottom', true)
      .text('FN');

    this.$labelsTop = this.$node.append('div')
      .classed('label-top', true)
      .append('div')
      .classed('labels', true);

    this.$labelsLeft = this.$node.append('div')
      .classed('label-left', true)
      .append('div')
      .classed('labels', true);

    const $mwrapper = this.$node.append('div')
      .classed('matrix-wrapper', true)
      .attr('data-aspect-ratio','one-by-one');
    this.$confusionMatrix = $mwrapper.append('div')
    .classed('matrix', true);

    const $chartRight = this.$node.append('div')
      .classed('chart-right', true);
    this.fpColumn = new ChartColumn($chartRight.append('div').classed('chart', true));

    const $chartBottom = this.$node.append('div')
      .classed('chart-bottom', true);
    this.fnColumn = new ChartColumn($chartBottom.append('div').classed('chart', true));

    this.accuracyColumn = new ChartColumn($chartRight.append('div').classed('chart', true));
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

  private loadConfusionData(matrix: INumericalMatrix) : Promise<NumberMatrix> {
    return matrix.data()
      .then((x: number[][]) => {
        const m = new SquareMatrix<number>(x.length);
        m.init(x);
        m.setDiagonal(new Array(m.order()).fill(0));
        return m;
      });
  }

  private loadLabels(table: ITable) : Promise<any> {
    return table.data()
      .then((x) => {
        return x;
    });
  }

  private renderPanels(data: NumberMatrix, labels: [number, string]) {
    const combined0 = transform(data, (r, c, matrix) => {return {count: matrix.values[r][c], label: labels[c][1]};});
    const combined1 = transform(data, (r, c, matrix) => {return {count: matrix.values[c][r], label: labels[c][1]};});

    //todo use real data!
    const accuracy = [0.4, 0.7, 0.2, 0.6, 0.3, 0.6, 0.8, 0.9, 0.2, 0.1];

    this.fpColumn.render(new BarchartCellRenderer(combined0));

    this.accuracyColumn.render(new HeatCellRenderer(accuracy));

    this.fnColumn.render(new BarchartCellRenderer(combined1));
  }

  private updateSingleEpoch(item:INumericalMatrix, classLabels: ITable) {
    const confusionData = this.loadConfusionData(item);
    const labels = this.loadLabels(classLabels);

    Promise.all([confusionData, labels]).then((x:any) => {
      this.checkDataSanity(x[0], x[1]);
      this.addRowAndColumnLabels(x[1]);
      this.renderSingleEpoch(x[0]);
      this.renderPanels(x[0], x[1]);
    });
  }

  checkDataSanity(data: NumberMatrix, labels: [number, String]) {
    if(data.order() !== labels.length) {
      throw new TypeError('The length of the labels does not fit with the matrix length');
    }
  }

  private addRowAndColumnLabels(labels: [number, string]) {
    this.renderLabels(this.$labelsLeft, labels);
    this.renderLabels(this.$labelsTop, labels);
  }

  private renderLabels($node: d3.Selection<any>, labels: [number, string]) {
    const classColors = d3.scale.category10();
    const $cells = $node.selectAll('div')
      .data(labels);
    $cells.enter().append('div')
      .classed('cell', true);
    $cells
      .text((datum: any) => {
        return datum[1];
      })
      .style('background-color', ((datum: any) => {
          return classColors(datum);
      }));

    $cells.exit().remove();
  }

  private renderSingleEpoch(data: NumberMatrix) {
    if(!data) {
      return;
    }
    const data1D = data.to1DArray();

    const heatmapColorScale = d3.scale.linear().domain([0, maxValue(data)])
      .range((<any>['white', 'gray']))
      .interpolate(<any>d3.interpolateHcl);

    const $cells = this.$confusionMatrix.selectAll('div')
      .data(data1D);
    $cells.enter().append('div')
      .classed('cell', true);
    $cells
      .text((datum: any) => {
        return datum;
      })
      .style('background-color', ((datum: number) => {
          return heatmapColorScale(datum);
      }));

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
