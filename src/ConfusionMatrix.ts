import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo, ILoadedMalevoEpoch, ILoadedMalevoDataset} from './MalevoDataset';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {
  ACellRenderer, MatrixLineCellRenderer,
  VerticalLineRenderer, BarChartRenderer, LabelCellRenderer, HeatmapMultiEpochRenderer, HeatmapSingleEpochRenderer,
  SingleEpochMarker, IMatrixRendererChain, createCellRenderers, applyRendererChain, removeListeners
} from './confusion_matrix_cell/ACellRenderer';
import {ACell, LabelCell, MatrixCell, PanelCell} from './confusion_matrix_cell/Cell';
import {zip} from './utils';
import * as confMeasures from './ConfusionMeasures';
import {Language} from './language';
import {SquareMatrix, max, Matrix} from './DataStructures';
import {
  DataStoreApplicationProperties, dataStoreTimelines,
  DataStoreTimelineSelection, RenderMode
} from './DataStore';
import {
  SingleEpochCalculator, Line, MultiEpochCalculator, MatrixHeatCellContent
} from './confusion_matrix_cell/CellContent';


export interface ICellData {
  linecell: Line[];
  heatcell: MatrixHeatCellContent;
}

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $matrixWrapper: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: ChartColumn;
  private fnColumn: ChartColumn;
  private precisionColumn: ChartColumn;
  private classSizeColumn: ChartColumn;
  private $cells = null;

  constructor(parent: Element) {
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
      .text(Language.FN);

    $labelRight.append('div')
      .text(Language.PRECISION);

    $labelRight.append('div')
      .text(Language.CLASS_SIZE);

    this.$node.append('div')
      .classed('malevo-label', true)
      .classed('label-bottom', true)
      .html(`<span>${Language.FP}</span>`);

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

    this.$matrixWrapper = this.$node.append('div')
      .classed('matrix-wrapper', true)
      .attr('data-aspect-ratio', 'one-by-one');

    this.$confusionMatrix = this.$matrixWrapper.append('div').classed('matrix', true);

    const $chartRight = this.$node.append('div').classed('chart-right', true);
    this.fnColumn = new ChartColumn($chartRight.append('div'));
    this.precisionColumn = new ChartColumn($chartRight.append('div'));
    this.classSizeColumn = new ChartColumn($chartRight.append('div'));

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fpColumn = new ChartColumn($chartBottom.append('div'));
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_REDRAW, (evt) => {
      this.clearDetailView();
      this.updateViews();
    });

    events.on(AppConstants.EVENT_CELL_RENDERER_TRANSPOSED, (evt, isTransposed) => {
      this.$matrixWrapper.classed('transpose-cells', isTransposed);

      this.$cells.each((c) => {
        // pass isTransposed flag to subsequent renderers in the chain
        let currentMatrixRenderer = (<any>c.renderer);
        while (currentMatrixRenderer !== null) {
          if (currentMatrixRenderer.isTransposed !== undefined) {
            currentMatrixRenderer.isTransposed = isTransposed;
          }
          currentMatrixRenderer = currentMatrixRenderer.nextRenderer;
        }
      });
      this.renderConfMatrixCells();
    });

    events.on(AppConstants.EVENT_CELL_RENDERER_CHANGED, (evt, switched) => {
      if (this.$cells == null) {
        return;
      }
      this.$cells.each((c) => {
        let currentMatrixRenderer = (<any>c.renderer);
        while (currentMatrixRenderer !== null) {
          if (currentMatrixRenderer instanceof HeatmapMultiEpochRenderer && switched) {
            removeListeners(currentMatrixRenderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]);
            c.renderer = new MatrixLineCellRenderer();
            this.setWeightUpdateListener(c.renderer);
            this.setYAxisScaleListener(c.renderer);
            if (DataStoreApplicationProperties.renderMode === RenderMode.COMBINED) {
              c.renderer.setNextRenderer(new HeatmapSingleEpochRenderer(false, true))
                .setNextRenderer(new VerticalLineRenderer(-1, -1));
            }
            this.$node.select('div .cfm-transpose-cell').style('display', 'none');
            break;
          } else if (currentMatrixRenderer instanceof MatrixLineCellRenderer && !switched) {
            removeListeners(currentMatrixRenderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]);
            c.renderer = new HeatmapMultiEpochRenderer(DataStoreApplicationProperties.transposeCellRenderer);
            this.setWeightUpdateListener(c.renderer);
            this.setYAxisScaleListener(c.renderer);
            if (DataStoreApplicationProperties.renderMode === RenderMode.COMBINED) {
              c.renderer.setNextRenderer(new SingleEpochMarker(DataStoreApplicationProperties.transposeCellRenderer));
            }
            this.$node.select('div .cfm-transpose-cell').style('display', 'initial');
            break;
          }
          currentMatrixRenderer = currentMatrixRenderer.nextRenderer;
        }
      });
      this.removeConfusionMatrixCellsContent();
      this.renderConfMatrixCells();
    });
  }


  clearDetailView() {
    events.fire(AppConstants.CLEAR_DETAIL_VIEW);
  }

  chooseRenderMode(datasets: ILoadedMalevoDataset[]) {
    DataStoreApplicationProperties.renderMode = RenderMode.CLEAR;

    const singleEpochDataExists = function (data: ILoadedMalevoDataset) {
      return !!data.singleEpochData;
    };

    const multiEpochDataExists = function (data: ILoadedMalevoDataset) {
      return !!data.multiEpochData && data.multiEpochData.length > 0;
    };
    // if at least one single epoch selection exists
    // => update render mode
    datasets.forEach((x) => {
      if (singleEpochDataExists(x)) {
        // tslint:disable-next-line:no-bitwise
        DataStoreApplicationProperties.renderMode |= RenderMode.SINGLE;
        return;
      }
    });

    // if at least one multi epoch selection exist
    // => update render mode
    datasets.forEach((x) => {
      if (multiEpochDataExists(x)) {
        // tslint:disable-next-line:no-bitwise
        DataStoreApplicationProperties.renderMode |= RenderMode.MULTI;
        return;
      }
    });

  }


  updateViews() {
    const dataStoreTimelineArray = Array.from(dataStoreTimelines.values()).sort((a, b) => a.indexInTimelineCollection - b.indexInTimelineCollection);
    const allPromises = dataStoreTimelineArray.map((value: DataStoreTimelineSelection) => {
      const loadDataPromises = [];
      loadDataPromises.push(this.loadEpochs(value.multiSelected, value.selectedDataset));
      loadDataPromises.push(this.loadEpochs([value.singleSelected], value.selectedDataset));
      loadDataPromises.push(this.loadLabels(value.selectedDataset.classLabels, value.selectedDataset));
      loadDataPromises.push(Promise.resolve(value.datasetColor));

      return Promise.all(loadDataPromises)
        .then((d: any[]) => { // [ILoadedMalevoEpoch[], ILoadedMalevoEpoch, string[]]
          return {multiEpochData: <ILoadedMalevoEpoch[]>d[0], singleEpochData: <ILoadedMalevoEpoch>d[1][0], labels: <string[]>d[2], datasetColor: <string>d[3], classSizes: this.calcClassSizes(d)};
        });
    });

    // wait until datasets are loaded
    Promise.all(allPromises).then((allDatasets) => {
      this.chooseRenderMode(allDatasets);
      this.renderCells(allDatasets);
      this.addRowAndColumnLabels(allDatasets[0].labels);
    });
  }

  private loadEpochs(matrix: IMalevoEpochInfo[], dataset: MalevoDataset): Promise<ILoadedMalevoEpoch[]> {
    if (matrix === null || matrix[0] === null) { // if a single epoch or multiepoch-range was deselected
      return Promise.resolve([]);
    }
    const res = matrix.map((x) => {
      return x.confusionInfo.data();
    });
    return Promise.all(res).then((loadedEpochData: number[][][]) => {
      console.assert(loadedEpochData.length === matrix.length);
      if (loadedEpochData.length !== matrix.length) {
        throw new Error('The loaded epoch data does not conform with its description');
      }
      return loadedEpochData.map((val: number[][], index: number) => {
        const m = new SquareMatrix<number>(val.length);
        m.init(val);
        return {name: matrix[index].name, confusionData: m, id: matrix[index].id};
      });
    });
  }

  private loadLabels(table: ITable, dataset: MalevoDataset): Promise<any> {
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
      .html((datum: string) => `<span>${datum}</span>`);

    $cells.exit().remove();
  }

  private removeConfusionMatrixCells() {
    this.detachListeners();
    this.$confusionMatrix
      .selectAll('div')
      .remove();
  }

  private removeConfusionMatrixCellsContent() {
    this.$confusionMatrix
      .selectAll('div')
      .html('');
  }

  private detachListeners() {
    const remove = (element: d3.Selection<any>) => {
      return element.selectAll('div.cell')
        .each((d: ACell) => removeListeners(d.renderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]));
    };
    remove(this.$confusionMatrix);
    remove(this.fpColumn.$node);
    remove(this.fnColumn.$node);
  }

  renderCells(datasets: ILoadedMalevoDataset[]) {
    this.removeConfusionMatrixCells(); // TODO Try to avoid removing all cells and use D3 enter-update instead

    this.fpColumn.$node.selectAll('div').remove();
    this.fnColumn.$node.selectAll('div').remove();
    this.precisionColumn.$node.selectAll('div').remove();
    this.classSizeColumn.$node.selectAll('div').remove();

    if (DataStoreApplicationProperties.renderMode === RenderMode.CLEAR) {
      return;
    }

    let singleEpochContent = null;
    let multiEpochContent = null;

    let data: ICellData[] = null;
    let dataPrecision = null;

    let fpfnRendererProto: IMatrixRendererChain = null;
    let confMatrixRendererProto: IMatrixRendererChain = null;
    let precRendererProto: IMatrixRendererChain = null;

    let singleEpochIndex = null;
    if (DataStoreApplicationProperties.renderMode === RenderMode.COMBINED) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      const zippedData = zip([singleEpochContent, multiEpochContent]);
      data = zippedData.map((x) => ({heatcell: x[0], linecell: x[1]}));

      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = data[1].heatcell.indexInMultiSelection;

      confMatrixRendererProto = {
        offdiagonal: [{renderer: 'HeatmapMultiEpochRenderer', params: [DataStoreApplicationProperties.transposeCellRenderer]},
        {renderer: 'SingleEpochMarker', params: [DataStoreApplicationProperties.transposeCellRenderer]}],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}], functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      fpfnRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}, {renderer: 'VerticalLineRenderer', params: [-1, -1]}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      precRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}, {renderer: 'VerticalLineRenderer', params: [-1, -1]}], offdiagonal: null,
        functors: []
      };

    } else if (DataStoreApplicationProperties.renderMode === RenderMode.SINGLE) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      data = singleEpochContent.map((x) => ({heatcell: x, linecell: null}));

      dataPrecision = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.PPV));
      singleEpochIndex = data[0].heatcell.indexInMultiSelection;

      confMatrixRendererProto = {offdiagonal: [{renderer: 'HeatmapSingleEpochRenderer', params: [false, false]}],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}], functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]};
      fpfnRendererProto = {
        diagonal: [{renderer: 'BarChartRenderer', params: null}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      precRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}, {renderer: 'VerticalLineRenderer', params: [-1, -1]}], offdiagonal: null,
        functors: []
      };

    } else if (DataStoreApplicationProperties.renderMode === RenderMode.MULTI) {
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      data = multiEpochContent.map((x) => ({heatcell: null, linecell: x}));

      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = null;

      confMatrixRendererProto = {offdiagonal: [{renderer: 'HeatmapMultiEpochRenderer', params: [DataStoreApplicationProperties.transposeCellRenderer]}],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}], functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]};
      fpfnRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      precRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}], offdiagonal: null,
        functors: []
      };
    }

    const that = this;

    const cellData = data.map((d, index) => {
      const groundTruth = Math.floor(index / AppConstants.CONF_MATRIX_SIZE);
      if (index % (AppConstants.CONF_MATRIX_SIZE + 1) === 0) {
        return new LabelCell({label: datasets[0].labels[groundTruth]});
      }
      const lineCellContent = data[index].linecell !== null ? data[index].linecell.map((x) => [x]) : null;
      const res = {linecell: lineCellContent, heatcell: data[index].heatcell};
      const predicted = index % AppConstants.CONF_MATRIX_SIZE;
      return new MatrixCell(res,
        datasets[0].labels[predicted],
        datasets[0].labels[groundTruth],
        predicted,
        groundTruth);
    });

    this.$cells = this.$confusionMatrix
      .selectAll('div')
      .data(cellData);

    this.$cells.enter()
      .append('div')
      .classed('cell', true)
      .each(function (d: ACell) {
        d.init(d3.select(this));
      });

    createCellRenderers(this.$cells, confMatrixRendererProto);
    this.renderConfMatrixCells();

    this.renderFPFN(data, fpfnRendererProto, singleEpochIndex);
    this.renderClassSize(datasets, new LabelCellRenderer());
    this.renderPrecisionColumn(dataPrecision, precRendererProto, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));
  }

  private renderConfMatrixCells() {
    this.$cells.each((r) => r.render());
  }

  renderPrecisionColumn(data: Matrix<number[]>[], renderer: IMatrixRendererChain, labels: string[], singleEpochIndex: number[], colors: string[]) {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    this.precisionColumn.$node
      .selectAll('div')
      .data(transformedData)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        const res = {
          linecell: datum.map((x, i) => [{values: x, valuesInPercent: x, max: maxVal, classLabel: labels[index], color: colors[i]}]),
          heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
        };
        const cell = new PanelCell(res, AppConstants.CELL_PRECISION);
        cell.init(d3.select(this));
        applyRendererChain(renderer, cell, renderer.diagonal);
        cell.render();
      });
  }

  renderFPFN(data: ICellData[], renderer: IMatrixRendererChain, singleEpochIndex: number[]) {
    const fpData = this.fpPanelData(data);
    const fnData = this.fnPanelData(data);

    const createCell = (type: string, data: ICellData[][], index: number) => {
      const confusionMatrixRow = data[index].map((x) => x);
      const lineCells = confusionMatrixRow.map((x) => x.linecell);
      const res = lineCells[index] !== null ? lineCells[0].map((_, i) => lineCells.map((elem, j) => lineCells[j][i])) : null;
      return new PanelCell({
        linecell: res,
        heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
      }, type);
    };

    this.fpColumn.$node
      .selectAll('div')
      .data(fpData.map((d, index) => {
        return createCell(AppConstants.CELL_FP, fpData, index);
      }))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (cell: ACell) {
        cell.init(d3.select(this));
        applyRendererChain(renderer, cell, renderer.diagonal);
        cell.render();
      });

    this.fnColumn.$node
      .selectAll('div')
      .data(fnData.map((d, index) => {
        return createCell(AppConstants.CELL_FN, fnData, index);
      }))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (cell: ACell) {
        cell.init(d3.select(this));
        applyRendererChain(renderer, cell, renderer.diagonal);
        cell.render();
      });
  }

  renderClassSize(datasets: ILoadedMalevoDataset[], renderer: ACellRenderer) {
    const classSizeData = datasets[0].classSizes;
    this.classSizeColumn.$node
      .selectAll('div')
      .data(classSizeData)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum: number, index: number) {
        const cell = new LabelCell({label: String(datum)});
        cell.init(d3.select(this));
        renderer.renderNext(cell);
      });
  }

  fnPanelData(data: ICellData[]): ICellData[][] {
    data = data.slice(0);
    const arrays = [], size = AppConstants.CONF_MATRIX_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays;
  }

  fpPanelData(data: ICellData[]): ICellData[][] {
    const res = [];
    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      res.push(data.filter((x, j) => j % AppConstants.CONF_MATRIX_SIZE === i));
    }
    return res;
  }

  calcClassSizes(data: any) {
    if (data[0].length === 0) {
      return confMeasures.calcForMultipleClasses(data[1][0].confusionData, confMeasures.ClassSize);
    } else {
      return confMeasures.calcForMultipleClasses(data[0][0].confusionData, confMeasures.ClassSize);
    }
  }

  setWeightUpdateListener(renderer: ACellRenderer) {
    renderer.addWeightFactorChangedListener();
  }

  setYAxisScaleListener(renderer: ACellRenderer) {
    renderer.addYAxisScaleChangedListener();
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMatrix(parent);
}
