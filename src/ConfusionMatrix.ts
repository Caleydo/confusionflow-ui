import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {
  BarChartCellRenderer, ConfusionMatrixHeatCellRenderer, HeatCellRenderer, MultilineChartCellRenderer,
  SingleLineChartCellRenderer, ConfusionMatrixLineChartCellRenderer, MultiEpochCellRenderer
} from './CellRenderer';
import {adaptTextColorToBgColor} from './utils';
import {BarChartCalculator, LineChartCalculator} from './MatrixCellCalculation';
import * as confMeasures from './ConfusionMeasures';
import {Language} from './language';
import {NumberMatrix, SquareMatrix, transformSq, setDiagonal} from './DataStructures';
import {DataStore} from './DataStore';

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
    events.on(AppConstants.EVENT_EPOCH_SELECTED, (evt) => {
      this.updateViews();
    });
  }

  updateViews() {
    if(DataStore.justOneEpochSelected() === true) {
      this.updateSingleEpoch();
    } else if(DataStore.rangeSelected() === true) {
      this.updateEpochRange();
    } else if(DataStore.singleAndRangeSelected() === true) {
      this.updateSingleAndEpochRange();
    } else {
      this.clearViews();
    }
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

  private renderPanelsRange(data: NumberMatrix[], labels: [number, string], singleEpochIndex: number) {
    if(data.length === 0) {
      return;
    }

    const calculator = new LineChartCalculator();
    const fpData = calculator.calculate(data, labels);
    const fnData = transformSq(fpData, (r, c, matrix) => {return {values: matrix.values[c][r].values, label: matrix.values[r][c].label};});
    console.assert(fpData.order() === data[0].order());

    this.fpColumn.render(new MultilineChartCellRenderer(fpData, singleEpochIndex, this.fpColumn.$node));

    this.precisionColumn.render(new SingleLineChartCellRenderer(confMeasures.calcEvolution(data, confMeasures.PPV), true, singleEpochIndex, this.precisionColumn.$node));

    this.fnColumn.render(new MultilineChartCellRenderer(fnData, singleEpochIndex, this.fnColumn.$node));
  }

  private renderPanelsSingleEpoch(data: NumberMatrix, labels: [number, string]) {
    const bcCalculator = new BarChartCalculator();

    const fpData = bcCalculator.calculate(data, labels);
    const fnData = transformSq(fpData, (r, c, matrix) => {return {count: matrix.values[c][r].count, label: matrix.values[r][c].label};});

    this.fpColumn.render(new BarChartCellRenderer(fpData, this.fpColumn.$node));

    this.precisionColumn.render(new HeatCellRenderer(confMeasures.calcForMultipleClasses(data, confMeasures.PPV), this.precisionColumn.$node));

    this.fnColumn.render(new BarChartCellRenderer(fnData, this.fnColumn.$node));
  }

  private updateEpochRange() {
    const promMultiEpoch = [];
    for(const item of DataStore.multiSelected) {
      promMultiEpoch.push(this.loadConfusionData(item.confusionInfo));
    }
    const promLabels = this.loadLabels(DataStore.labels);
    promMultiEpoch.push(promLabels);

    Promise.all(promMultiEpoch).then((x: any) => {
      const labels = x.splice(-1, 1)[0];
      this.checkDataSanity(x, labels);
      this.addRowAndColumnLabels(labels);
      this.renderEpochRange(x, labels);
      this.renderPanelsRange(x, labels, -1);
    });
  }

  private updateSingleEpoch() {
    const confusionData = this.loadConfusionData(DataStore.singleSelected.confusionInfo);
    const promLabels = this.loadLabels(DataStore.labels);

    Promise.all([confusionData, promLabels]).then((x:any) => {
      this.checkDataSanity([x[0]], x[1]);
      this.addRowAndColumnLabels(x[1]);
      this.renderSingleEpoch(x[0], x[1]);
      this.renderPanelsSingleEpoch(x[0], x[1]);
    });
  }

  private updateSingleAndEpochRange() {
    const promMultiEpoch = [];
    for(const item of DataStore.multiSelected) {
      promMultiEpoch.push(this.loadConfusionData(item.confusionInfo));
    }
    const promSingleEpoch = this.loadConfusionData(DataStore.singleSelected.confusionInfo);
    const promLabels = this.loadLabels(DataStore.labels);

    promMultiEpoch.push(promSingleEpoch);
    promMultiEpoch.push(promLabels);

    const singleEpochIndex = DataStore.multiSelected.findIndex((x) => x === DataStore.singleSelected);

    Promise.all(promMultiEpoch).then((x: any) => {
      const labels = x.splice(-1,1)[0];
      const single = x.splice(-1,1);
      this.checkDataSanity(single, labels);
      this.addRowAndColumnLabels(labels);
      this.renderCombined(x, single[0],labels, singleEpochIndex);
      this.renderPanelsRange(x, labels, singleEpochIndex);
    });
  }

  private checkDataSanity(data: NumberMatrix[], labels: [number, String]) {
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
      //todo handle correctly
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

  private renderEpochRange(data: NumberMatrix[], labels: [number, string]) {
    if(!data || data.length === 0) {
      return;
    }

    const calculator = new LineChartCalculator();
    const cellContent = calculator.calculate(data, labels);
    console.assert(cellContent.order() === data[0].order());

    new ConfusionMatrixLineChartCellRenderer(cellContent, true, -1, labels, this.$confusionMatrix).renderCells();
  }

  private renderSingleEpoch(data: NumberMatrix, labels: [number, string]) {
    if(!data) {
      return;
    }
    data = data.clone();
    setDiagonal(data, (r) => {return 0;});
    new ConfusionMatrixHeatCellRenderer(data, data.to1DArray(), labels, this.$confusionMatrix).renderCells();
  }

  private renderCombined(multiEpochData: NumberMatrix[], singleEpochData: NumberMatrix, labels: [number, string], singleEpochIndex: number) {
    if(!multiEpochData || multiEpochData.length === 0 || !singleEpochData) {
      return;
    }

    singleEpochData = singleEpochData.clone();
    setDiagonal(singleEpochData, (r) => {return 0;});
    const calculator = new LineChartCalculator();
    const lineData = calculator.calculate(multiEpochData, labels);

    new MultiEpochCellRenderer(lineData, singleEpochData, true, labels, singleEpochIndex, this.$confusionMatrix).renderCells();
  }

  private clearViews() {
    console.log('clear');
    this.$confusionMatrix.selectAll('div').remove();
    this.fpColumn.clear();
    this.fnColumn.clear();
    this.precisionColumn.clear();
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
