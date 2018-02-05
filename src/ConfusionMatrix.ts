import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {BarChartCellRenderer, HeatCellRenderer, LineChartCellRenderer} from './CellRenderer';
import {adaptTextColorToBgColor} from './utils';
import {LineChartCalculator} from './MatrixCellCalculation';
import * as confmeasures from './ConfusionMeasures';
import {Language} from './language';
import {IClassEvolution, NumberMatrix, SquareMatrix, maxValue, transform, setDiagonal} from './DataStructures';

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: ChartColumn;
  private fnColumn: ChartColumn;
  private precisionColumn: ChartColumn;

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
      .text(Language.PREDICTED);

    this.$node.append('div')
      .classed('axis', true)
      .classed('axis-left', true)
      .append('span')
      .text(Language.GROUND_TRUTH);

    const $labelRight = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-right', true);

    $labelRight.append('div')
      .text(Language.FP);

    $labelRight.append('div')
      .text(Language.PRECISION);

    this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-bottom', true)
      .text(Language.FN);

    this.$labelsTop = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-top', true)
      .append('div')
      .classed('labels', true);

    this.$labelsLeft = this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-left', true)
      .append('div')
      .classed('labels', true);

    const $mwrapper = this.$node.append('div')
      .classed('matrix-wrapper', true)
      .attr('data-aspect-ratio','one-by-one');

    this.$confusionMatrix = $mwrapper.append('div').classed('matrix', true);

    const $chartRight = this.$node.append('div').classed('chart-right', true);
    this.fpColumn = new ChartColumn($chartRight.append('div'));
    this.precisionColumn = new ChartColumn($chartRight.append('div'));

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fnColumn = new ChartColumn($chartBottom.append('div'));
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_EPOCH_SELECTED, (evt, items:IMalevoEpochInfo[], dataset:MalevoDataset) => {
      if(items.length === 0) {
        return;
      } else if(items.length === 1) {
        this.updateSingleEpoch(items[0].confusionInfo, dataset.classLabels);
      } else {
        this.updateEpochRange(items, dataset.classLabels);
      }
    });
  }

  private loadConfusionData(matrix: INumericalMatrix) : Promise<NumberMatrix> {
    return matrix.data()
      .then((x: number[][]) => {
        const m = new SquareMatrix<number>(x.length);
        m.init(x);
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
    const combined0 = transform(data, (r, c, value) => {return {count: value, label: labels[c][1]};});
    setDiagonal(combined0, (r) => {return {count: 0, label: labels[r][1]};});

    const combined1 = transform(data, (r, c, value) => {return {count: value, label: labels[c][1]};});
    setDiagonal(combined1, (r) => {return {count: 0, label: labels[r][1]};});

    this.fpColumn.render(new BarChartCellRenderer(combined0));

    this.precisionColumn.render(new HeatCellRenderer(confmeasures.calcForMultipleClasses(data, confmeasures.PPV)));

    this.fnColumn.render(new BarChartCellRenderer(combined1));
  }

  private updateEpochRange(items:IMalevoEpochInfo[], classLabels: ITable) {
    const dataPromises = [];
    for(const item of items) {
      dataPromises.push(this.loadConfusionData(item.confusionInfo));
    }
    dataPromises.push(this.loadLabels(classLabels));

    Promise.all(dataPromises).then((x: any) => {
      const labels = x.splice(-1, 1)[0];
      this.checkDataSanity(x, labels);
      this.addRowAndColumnLabels(labels);
      this.renderEpochRange(x);
    });
  }

  private updateSingleEpoch(item:INumericalMatrix, classLabels: ITable) {
    const confusionData = this.loadConfusionData(item);
    const labels = this.loadLabels(classLabels);

    Promise.all([confusionData, labels]).then((x:any) => {
      this.checkDataSanity([x[0]], x[1]);
      this.addRowAndColumnLabels(x[1]);
      this.renderSingleEpoch(x[0]);
      this.renderPanels(x[0], x[1]);
    });
  }

  checkDataSanity(data: NumberMatrix[], labels: [number, String]) {
    if(data.length === 0) {
      throw new TypeError('No confusion matrix was found');
    }
    const order = data[0].order();

    for(let i = 1; i < data.length; i++) {
      if(order !== data[i].order()) {
        throw new TypeError('The loaded confusion matrix is not valid');
      }
    }
    if(order !== labels.length) {
      //todo handle correctly (ask holger)
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

    $cells.enter()
      .append('div')
      .classed('cell', true);

    $cells
      .text((datum: any) => datum[1])
      .style('background-color', (datum: any) => classColors(datum))
      .style('color', (datum: any) => adaptTextColorToBgColor(classColors(datum)));

    $cells.exit().remove();
  }

  private renderEpochRange(data: NumberMatrix[]) {
    if(!data || data.length === 0) {
      return;
    }

    const calculator = new LineChartCalculator();
    const cellContent = calculator.calculate(data);
    console.assert(cellContent.order() === data[0].order());
    const transRes = transform<number[], IClassEvolution>(cellContent, (r, c, value) => {return {values: value, label: ''};});

    new LineChartCellRenderer(transRes).renderCells(this.$confusionMatrix);
  }

  private renderSingleEpoch(data: NumberMatrix) {
    if(!data) {
      return;
    }
    data = data.clone();
    setDiagonal(data, (r) => {return 0;});
    const data1D = data.to1DArray();

    const heatmapColorScale = d3.scale.linear().domain([0, maxValue(data)])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    const $cells = this.$confusionMatrix
      .selectAll('div')
      .data(data1D);

    $cells.enter()
      .append('div')
      .classed('cell', true);

    $cells
      .text((datum: any) => datum)
      .style('background-color', (datum: number) => heatmapColorScale(datum))
      .style('color', (datum: number) => adaptTextColorToBgColor(heatmapColorScale(datum).toString()));

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
