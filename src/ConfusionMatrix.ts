import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo, ILoadedMalevoEpoch, ILoadedMalevoDataset} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {
  ACellRenderer, HeatCellRenderer, MatrixLineCellRenderer,
  VerticalLineRenderer, BarchartRenderer, LabelCellRenderer
} from './confusion_matrix_cell/ACellRenderer';
import {ACell, LabelCell, MatrixCell, PanelCell} from './confusion_matrix_cell/Cell';
import {adaptTextColorToBgColor, zip} from './utils';
import {BarChartCalculator, LineChartCalculator} from './MatrixCellCalculation';
import * as confMeasures from './ConfusionMeasures';
import {Language} from './language';
import {NumberMatrix, SquareMatrix, transformSq, setDiagonal, max, IClassEvolution, Matrix} from './DataStructures';
import {DataStoreCellSelection, dataStoreTimelines, DataStoreTimelineSelection} from './DataStore';
import {
  SingleEpochCalculator, Line, MultiEpochCalculator, MatrixHeatCellContent} from './confusion_matrix_cell/CellContent';


enum RenderMode {
  CLEAR = 0,
  SINGLE = 1,
  MULTI = 2,
  COMBINED = 3
}

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: ChartColumn;
  private fnColumn: ChartColumn;
  private precisionColumn: ChartColumn;
  private classSizeColumn: ChartColumn;
  private renderMode: RenderMode = RenderMode.COMBINED;
  private readonly CONF_SIZE = 10;

  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('grid', true);
    DataStoreCellSelection.$grid = this.$node;
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
      .classed('cfm-axis', true)
      .classed('axis-top', true)
      .text(Language.PREDICTED);

    this.$node.append('div')
      .classed('cfm-axis', true)
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

    $labelRight.append('div')
      .text(Language.CLASS_SIZE);

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
    this.classSizeColumn = new ChartColumn($chartRight.append('div'));

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fnColumn = new ChartColumn($chartBottom.append('div'));
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_REDRAW, (evt) => {
	    this.clearDetailView();
      this.updateViews();
    });
  }

  clearDetailView() {
	  events.fire(AppConstants.CLEAR_DETAIL_VIEW);
  }

  chooseRenderMode(datasets: ILoadedMalevoDataset[]) {
    this.renderMode = RenderMode.CLEAR;

    const singleEpochDataExists = function(data: ILoadedMalevoDataset) {
      return !!data.singleEpochData;
    };

    const multiEpochDataExists = function(data: ILoadedMalevoDataset) {
      return !!data.multiEpochData && data.multiEpochData.length > 0;
    };
    // if at least one single epoch selection exists
    // => update render mode
    datasets.forEach((x) => {
      if(singleEpochDataExists(x)) {
        this.renderMode |= RenderMode.SINGLE;
        return;
      }
    });

    // if at least one multi epoch selection exist
    // => update render mode
    datasets.forEach((x) => {
      if(multiEpochDataExists(x)) {
        this.renderMode |= RenderMode.MULTI;
        return;
      }
    });

  }

  updateViews() {
    const allPromises0 = [];
    const allPromises1 = [];

    dataStoreTimelines.forEach((value: DataStoreTimelineSelection) => {
      const loadDataPromises = [];
      loadDataPromises.push(this.loadEpochs(value.multiSelected, value.selectedDataset));
      loadDataPromises.push(this.loadEpochs([value.singleSelected], value.selectedDataset));
      loadDataPromises.push(this.loadLabels(value.selectedDataset.classLabels, value.selectedDataset));
      allPromises0.push(loadDataPromises);
    });
    const allDatasets: ILoadedMalevoDataset[] = [];
    allPromises0.forEach((x) => {
      const pr = Promise.all(x).then((x: [ILoadedMalevoEpoch[], ILoadedMalevoEpoch, string[]]) => {
        const ds = {multiEpochData: x[0], singleEpochData: x[1][0], labels: x[2]};
        allDatasets.push(ds);
      });
      allPromises1.push(pr);
    });

    Promise.all(allPromises1).then((x) => {
      this.chooseRenderMode(allDatasets);
      this.renderCMCells(allDatasets);
      this.addRowAndColumnLabels(allDatasets[0].labels);
    });
  }

  private loadEpochs(matrix: IMalevoEpochInfo[], dataset: MalevoDataset): Promise<ILoadedMalevoEpoch[]> {
    if(matrix === null || matrix[0] === null) { // if a single epoch or multiepoch-range was deselected
      return Promise.resolve([]);
    }
    const res = matrix.map((x) => {
      return x.confusionInfo.data();
    });
    return Promise.all(res).then((loadedEpochData: number[][][]) => {
      console.assert(loadedEpochData.length === matrix.length);
      if(loadedEpochData.length !== matrix.length) {
        throw new Error('The loaded epoch data does not conform with its description');
      }
      return loadedEpochData.map((val: number[][], index: number) => {
        const m = new SquareMatrix<number>(val.length);
        m.init(val);
        return {name: matrix[index].name, confusionData: m, id: matrix[index].id};
      });
    });
  }

  private loadLabels(table: ITable, dataset: MalevoDataset) : Promise<any> {
    return table.data()
      .then((x: [[number, string]]) => {
        return x.map((x) => x[1]);
      });
  }

  private addRowAndColumnLabels(labels: string[]) {
    this.renderLabels(this.$labelsLeft, labels);
    this.renderLabels(this.$labelsTop, labels);
  }

  private renderLabels($node: d3.Selection<any>, labels: string[]) {
    const classColors = d3.scale.category10();

    const $cells = $node.selectAll('div')
      .data(labels);

    $cells.enter()
      .append('div')
      .classed('cell', true)
      .classed('label-cell', true);

    $cells
      .text((datum: string) => datum)
      .style('background-color', (datum: string) => classColors(datum))
      .style('color', (datum: string) => adaptTextColorToBgColor(classColors(datum)));

    $cells.exit().remove();
  }

  private checkDataSanity(loadedMalevoEpochs: ILoadedMalevoEpoch[][], loadedClasslabels: string[][]) {

    if(loadedClasslabels.length === 0 || loadedClasslabels[0].length === 0) {
      throw new TypeError('No class labels were found');
    }

    loadedMalevoEpochs.forEach((v) => {
      const data = v;
      if(data.length === 0) {
        throw new TypeError('No confusion matrix was found');
      }

      const order = v[0].confusionData.order();

      for(let i = 1; i < data.length; i++) {
        if(order !== data[i].confusionData.order()) {
          throw new TypeError('The loaded confusion matrix is not valid');
        }
      }

      if(order !== loadedClasslabels[0].length) {
        throw new TypeError('The length of the labels does not fit with the matrix length');
      }
    });
  }

  renderCMCells(datasets: ILoadedMalevoDataset[]) {
    this.$confusionMatrix
      .selectAll('div')
      .remove();

    this.fpColumn.$node.selectAll('div').remove();
    this.fnColumn.$node.selectAll('div').remove();
    this.precisionColumn.$node.selectAll('div').remove();
    this.classSizeColumn.$node.selectAll('div').remove();

    if(this.renderMode === RenderMode.CLEAR) {
      return;
    }

    let singleEpochContent = null;
    let multiEpochContent = null;

    let $cells = null;

    let data: {linecell: Line[], heatcell: MatrixHeatCellContent}[] = null;
    let datafpfn = null;
    let dataPrecision = null;

    let matrixRenderer = null;
    let fpfnRenderer = null;

    let singleEpochIndex = null;
    if(this.renderMode === RenderMode.COMBINED) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      const zippedData = zip([singleEpochContent, multiEpochContent]);
      $cells = this.$confusionMatrix
      .selectAll('div')
      .data(zippedData.map(() => 0));

      data = zippedData.map((x) => {
        return {heatcell: x[0], linecell: x[1]};
      });
      datafpfn = multiEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = data[1].heatcell.indexInMultiSelection;

      matrixRenderer = new HeatCellRenderer(false);
      matrixRenderer
        .setNextRenderer(new MatrixLineCellRenderer())
        .setNextRenderer(new VerticalLineRenderer());
      fpfnRenderer = new MatrixLineCellRenderer();
      fpfnRenderer
        .setNextRenderer(new VerticalLineRenderer());
    } else if(this.renderMode === RenderMode.SINGLE) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      data = singleEpochContent.map((x) => {return {heatcell: x, linecell: null};});
      $cells = this.$confusionMatrix
        .selectAll('div')
        .data(singleEpochContent.map(() => 0));
      datafpfn = singleEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.PPV));
      singleEpochIndex = data[0].heatcell.indexInMultiSelection;

      matrixRenderer = new HeatCellRenderer(true);
      fpfnRenderer = new BarchartRenderer();
    } else if(this.renderMode === RenderMode.MULTI) {
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      data = multiEpochContent.map((x) => {return {heatcell: null, linecell: x};});
      $cells = this.$confusionMatrix
        .selectAll('div')
        .data(multiEpochContent.map(() => 0));

      datafpfn = multiEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = null;

      matrixRenderer = new MatrixLineCellRenderer();
      fpfnRenderer = new MatrixLineCellRenderer();
    }

    $cells.enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        matrixRenderer.renderNext(new MatrixCell(data[index], d3.select(this)));
      });

    this.renderFPFN(data, fpfnRenderer, singleEpochIndex);
    this.renderClassSize(datasets, new LabelCellRenderer());
    this.renderPrecisionColumn(dataPrecision, fpfnRenderer, datasets[0].labels, singleEpochIndex);
  }

  renderPrecisionColumn(data: Matrix<number[]>[], renderer: ACellRenderer, labels: string[], singleEpochIndex: number) {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    this.precisionColumn.$node
      .selectAll('div')
      .data(transformedData)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function(datum, index) {
        const completeDatum = {linecell: datum.map((x) => {return {values: x, max: maxVal, classLabel: labels[index]};}),
          heatcell: {indexInMultiSelection: [singleEpochIndex], counts: null, colorValues: null, classLabels: null}};
        renderer.renderNext(new PanelCell(completeDatum, d3.select(this), AppConstants.CELL_PRECISION));
      });
  }

  renderFPFN(data: {linecell: Line[], heatcell: MatrixHeatCellContent}[], renderer: ACellRenderer, singleEpochIndex: number) {
    const fpData = this.fpPanelData(data);
    const fnData = this.fnPanelData(data);

    this.fpColumn.$node
      .selectAll('div')
      .data(fpData.map(() => 0))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        const y = fpData[index].map((x) => x);
        const z = y.map((x) => x.linecell);
        const merged = [].concat.apply([], z);
        renderer.renderNext(new PanelCell({linecell: merged,
          heatcell: {indexInMultiSelection: [singleEpochIndex], counts: null, colorValues: null, classLabels: null}},
          d3.select(this), AppConstants.CELL_FP));
      });

    this.fnColumn.$node
      .selectAll('div')
      .data(fnData.map(() => 0))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        const y = fnData[index].map((x) => x);
        const z = y.map((x) => x.linecell);
        const merged = [].concat.apply([], z);
        renderer.renderNext(new PanelCell({linecell: merged,
          heatcell: {indexInMultiSelection: [singleEpochIndex], counts: null, colorValues: null, classLabels: null}},
          d3.select(this), AppConstants.CELL_FN));
      });
  }

    renderClassSize(datasets: ILoadedMalevoDataset[], renderer: ACellRenderer) {
    const classSizeData = this.classSizeData(datasets);
    this.classSizeColumn.$node
      .selectAll('div')
      .data(classSizeData)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function(datum: number, index: number) {
        renderer.renderNext(new LabelCell({label: String(datum)}, d3.select(this)));
      });
  }

  fpPanelData(data: {linecell: Line[], heatcell: MatrixHeatCellContent}[]) {
    data = data.slice(0);
    const arrays = [], size = this.CONF_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays;
  }

  fnPanelData(data: {linecell: Line[], heatcell: MatrixHeatCellContent}[]) {
    const res = [];
    for(let i = 0; i < this.CONF_SIZE; i++) {
      res.push(data.filter((x, j) => j % 10 === i));
    }
    return res;
  }

  classSizeData(datasets: ILoadedMalevoDataset[]) {
    if(datasets[0].singleEpochData) {
      return confMeasures.calcForMultipleClasses(datasets[0].singleEpochData.confusionData, confMeasures.ClassSize);
    }
    return confMeasures.calcForMultipleClasses(datasets[0].multiEpochData[0].confusionData, confMeasures.ClassSize);
  }


  /*filterDiagonals(heatmapContent: {}[], lineContent: {}[]) {
    heatmapContent.map((x: MatrixHeatCellContent, i: number) => {
      if(i % 11 === 0) {
        x.colorValues = x.colorValues.map(() => '#00000');
        x.counts = x.counts.map(() => 0);
        x.classLabels = x.classLabels.map(() => '');
      }
    });

    lineContent.map((x: Line[], i: number) => {
      if(i % 11 === 0) {
        x.map((y) => {
          y.classLabel = '';
          y.max = 0;
          y.values = [];
        });
      }
    });
  }*/
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
