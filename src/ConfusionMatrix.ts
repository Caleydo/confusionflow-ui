import * as d3 from 'd3';
import * as $ from 'jquery';
import * as events from 'phovea_core/src/event';
import {ITable} from 'phovea_core/src/table';
import 'select2';
import {IAppView} from './app';
import {AppConstants} from './AppConstants';
import {ChartColumn} from './ChartColumn';
import * as confMeasures from './ConfusionMeasures';
import {
  ACellRenderer,
  applyRendererChain,
  createCellRenderers,
  HeatmapMultiEpochRenderer,
  HeatmapSingleEpochRenderer,
  IMatrixRendererChain,
  MatrixLineCellRenderer,
  removeListeners,
  SingleEpochMarker,
  VerticalLineRenderer
} from './confusion_matrix_cell/ACellRenderer';
import {ACell, LabelCell, MatrixCell, PanelCell} from './confusion_matrix_cell/Cell';
import {
  Line,
  MatrixHeatCellContent,
  MultiEpochCalculator,
  SingleEpochCalculator
} from './confusion_matrix_cell/CellContent';
import {
  DataStoreApplicationProperties, DataStoreLoadedRuns, DataStoreSelectedRun, RenderMode,
  DataStoreCellSelection, dataStoreRuns
} from './DataStore';
import {SquareMatrix} from './DataStructures';
import {Language} from './language';
import {ILoadedMalevoDataset, ILoadedMalevoEpoch, IMalevoEpochInfo, MalevoDataset} from './MalevoDataset';
import {simulateClick, zip} from './utils';


export interface ICellData {
  linecell: Line[];
  heatcell: MatrixHeatCellContent;
}

export class ConfusionMatrix implements IAppView {
  private readonly $node: d3.Selection<any>;
  private $matrixWrapper: d3.Selection<any>;
  private $confusionMatrix: d3.Selection<any>;
  private $classSelector: d3.Selection<any>;
  private $labelsTop: d3.Selection<any>;
  private $labelsLeft: d3.Selection<any>;
  private fpColumn: ChartColumn;
  private fnColumn: ChartColumn;
  private $cells = null;
  private cellsBottomRight: d3.Selection<any>;

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
    const $axisTop = this.$node.append('div')
      .classed('cfm-axis', true)
      .classed('axis-top', true)
      .html(`
        <div>${Language.PREDICTED}</div>
        <div class="dropdown">
          <a href="#" id="classSelectorLabel" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
            <i class="fa fa-cog" aria-hide="true" title="${Language.SELECT_CLASSES}"></i>
            <span class="sr-only">${Language.SELECT_CLASSES}</span>
          </a>

          <div class="dropdown-menu" aria-labelledby="classSelectorLabel">
            <div class="checkbox select-all"><label><input type="checkbox" value="all">Select all</label></div>
            <form action="#" method="GET">
              <div class="form-group"></div>
              <div class="form-footer">
                <p class="text-warning hidden">Select at least 2 classes</p>
                <button type="submit" class="btn btn-sm btn-primary">${Language.APPLY}</button>
              </div>
            </form>
          </div>
        </div>
      `);

    this.$classSelector = $axisTop.select('.dropdown-menu');

    this.$classSelector.select('form').on('submit', () => {
      (<any>d3.event).stopPropagation(); // prevent sending the form
      $($axisTop.select('#classSelectorLabel').node()).dropdown('toggle');
      const classIds = this.$classSelector.selectAll('div.form-group input[type="checkbox"]:checked')[0].map((d: HTMLInputElement) => +d.value);
      DataStoreApplicationProperties.selectedClassIndices = classIds;
    });

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

    const $labelBottom = this.$node.append('div')
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

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fpColumn = new ChartColumn($chartBottom.append('div'));

    const numRightColumns = 1; // number of additional columns
    this.$node.style('--num-right-columns', numRightColumns);

    const numBottomColumns = 1; // number of additional columns
    this.$node.style('--num-bottom-columns', numBottomColumns);

    this.cellsBottomRight = this.$node.append('div').classed('chart-bottom-right', true);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_REDRAW, (evt) => {
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

    events.on(AppConstants.EVENT_CLASS_INDICES_CHANGED, (evt) => {
      this.render();
    });
  }

  clearDetailView() {
    events.fire(AppConstants.CLEAR_CONF_MEASURES_VIEW);
    events.fire(AppConstants.EVENT_CLEAR_DETAIL_CHART);
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
    const dataStoreTimelineArray = Array.from(dataStoreRuns.values()).sort((a, b) => a.selectionIndex - b.selectionIndex);
    const allPromises: Promise<ILoadedMalevoDataset>[] = dataStoreTimelineArray.map((value: DataStoreSelectedRun) => {
      const loadDataPromises = [];
      loadDataPromises.push(this.loadEpochs(value.multiSelected, value.selectedDataset));
      loadDataPromises.push(this.loadEpochs([value.singleSelected], value.selectedDataset));
      loadDataPromises.push(value.selectedDataset.classLabels.data());
      loadDataPromises.push(Promise.resolve(value.color));

      return Promise.all(loadDataPromises)
        .then((d: any[]): ILoadedMalevoDataset => { // [ILoadedMalevoEpoch[], ILoadedMalevoEpoch, string[]]
          const labels: string[] = d[2].map((x) => x[1]);
          const labelIds: number[] = d[2].map((x) => x[0]);

          return {
            multiEpochData: <ILoadedMalevoEpoch[]>d[0],
            singleEpochData: <ILoadedMalevoEpoch>d[1][0],
            labels,
            labelIds,
            datasetColor: <string>d[3],
            classSizes: this.calcClassSizes(d)
          };
        });
    });

    // wait until datasets are loaded
    Promise.all(allPromises).then((allDatasets: ILoadedMalevoDataset[]) => {
      DataStoreLoadedRuns.runs = allDatasets;
      if (allDatasets.length === 0) {
        this.clear();
        this.clearDetailView();
        return;
      }

      DataStoreApplicationProperties.selectedClassIndices = allDatasets[0].labelIds; // -> fires event -> listener calls render()
      this.renderClassSelector(allDatasets[0].labelIds, allDatasets[0].labels, DataStoreApplicationProperties.selectedClassIndices);
    });
  }

  private render() {
    const filteredAllDatasets = this.filter(DataStoreLoadedRuns.runs, DataStoreApplicationProperties.selectedClassIndices);
    this.$node.classed(`grid-${AppConstants.CONF_MATRIX_SIZE}`, false);
    AppConstants.CONF_MATRIX_SIZE = DataStoreApplicationProperties.selectedClassIndices.length;
    this.$node.classed(`grid-${AppConstants.CONF_MATRIX_SIZE}`, true);
    this.$node.style('--matrix-size', AppConstants.CONF_MATRIX_SIZE);
    this.chooseRenderMode(filteredAllDatasets);
    this.renderCells(filteredAllDatasets);
    if (DataStoreLoadedRuns.runs.length > 0) {
      this.addRowAndColumnLabels(filteredAllDatasets[0].labels);
    }
    this.setInitialCell();
    this.setInitialToolbarStates();
  }

  private filter(datasets: ILoadedMalevoDataset[], indexArray: number[]): ILoadedMalevoDataset[] {
    return datasets.map((ds: ILoadedMalevoDataset) => {
      const newMultiEpochData = ds.multiEpochData.map((epoch) => {
        const newMatrix = epoch.confusionData.filter(indexArray);
        return {name: epoch.name, id: epoch.id, confusionData: newMatrix};
      });

      const newSingleEpochData = {
        name: ds.singleEpochData.name,
        confusionData: ds.singleEpochData.confusionData.filter(indexArray),
        id: ds.singleEpochData.id
      };

      return {
        multiEpochData: newMultiEpochData,
        singleEpochData: newSingleEpochData,
        labels: indexArray.map((x) => ds.labels[x]),
        labelIds: indexArray.map((x) => ds.labelIds[x]),
        datasetColor: ds.datasetColor,
        classSizes: indexArray.map((x) => ds.classSizes[x])
      };
    });
  }

  private loadEpochs(matrix: IMalevoEpochInfo[], dataset: MalevoDataset): Promise<ILoadedMalevoEpoch[]> {
    if (matrix === null || matrix[0] === null) { // if a single epoch or multiepoch-range was deselected
      return Promise.resolve([]);
    }
    matrix = matrix.filter((epochInfo) => epochInfo !== null);
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

  private loadLabels(table: ITable, dataset: MalevoDataset): Promise<string[]> {
    return table.data()
      .then((x: [[number, string]]) => {
        return x.map((x) => x[1]);
      });
  }

  private renderClassSelector(labelIds: number[], labels: string[], selected: number[]) {
    this.$classSelector.select('.select-all input').property('checked', (labelIds.length === selected.length));

    this.$classSelector.on('click', () => {
      (<any>d3.event).stopPropagation(); // prevent closing the bootstrap dropdown
    });

    this.$classSelector.select('.select-all input').on('change', () => {
      const isSelectAll = this.$classSelector.select('.select-all input').property('checked');
      this.$classSelector.select('form').selectAll('input[type="checkbox"]').property('checked', isSelectAll);
      this.$classSelector.select('.form-footer button').property('disabled', (isSelectAll === false));
      this.$classSelector.select('.form-footer p').classed('hidden', (isSelectAll === true));
    });

    const $labels = this.$classSelector.select('div.form-group').selectAll('div.checkbox').data(zip([labelIds, labels]));
    const $labelsEnter = $labels.enter().append('div').classed('checkbox', true)
      .html((d) => {
        return `<label><input type="checkbox" value="${d[0]}">${d[1]}</label>`;
      });
    $labelsEnter.select('input')
      .property('checked', (d) => (selected.indexOf(d[0]) > -1))
      .on('change', () => {
        const numSelected = this.$classSelector.selectAll('div.form-group input[type="checkbox"]:checked')[0].length;
        this.$classSelector.select('.form-footer button').property('disabled', (numSelected < 2));
        this.$classSelector.select('.form-footer p').classed('hidden', (numSelected >= 2));
      });
    $labels.exit().remove();
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

  clear() {
    this.removeConfusionMatrixCells(); // TODO Try to avoid removing all cells and use D3 enter-update instead

    this.fpColumn.$node.selectAll('div').remove();
    this.fnColumn.$node.selectAll('div').remove();
    this.cellsBottomRight.select('div').remove();
  }

  renderCells(datasets: ILoadedMalevoDataset[]) {
    this.clear();
    if (DataStoreApplicationProperties.renderMode === RenderMode.CLEAR) {
      return;
    }

    let singleEpochContent = null;
    let multiEpochContent = null;

    let data: ICellData[] = null;
    let dataOverallAccuracy = null;

    let fpfnRendererProto: IMatrixRendererChain = null;
    let confMatrixRendererProto: IMatrixRendererChain = null;
    let lineChartRendererProto: IMatrixRendererChain = null;
    const labelRendererProto = {
      diagonal: [{renderer: 'LabelCellRenderer', params: null}], offdiagonal: null,
      functors: []
    };

    let singleEpochIndex = null;
    if (DataStoreApplicationProperties.renderMode === RenderMode.COMBINED) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      const zippedData = zip([singleEpochContent, multiEpochContent]);
      data = zippedData.map((x) => ({heatcell: x[0], linecell: x[1]}));

      dataOverallAccuracy = datasets.map((x) => confMeasures.calcOverallAccuracy(x.multiEpochData.map((y) => y.confusionData)));
      singleEpochIndex = data[1].heatcell.indexInMultiSelection;

      confMatrixRendererProto = {
        offdiagonal: [{
          renderer: 'HeatmapMultiEpochRenderer',
          params: [DataStoreApplicationProperties.transposeCellRenderer]
        },
          {renderer: 'SingleEpochMarker', params: [DataStoreApplicationProperties.transposeCellRenderer]}],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}],
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      fpfnRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}, {
          renderer: 'VerticalLineRenderer',
          params: [-1, -1]
        }], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      lineChartRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}, {
          renderer: 'VerticalLineRenderer',
          params: [-1, -1]
        }], offdiagonal: null,
        functors: []
      };

    } else if (DataStoreApplicationProperties.renderMode === RenderMode.SINGLE) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      data = singleEpochContent.map((x) => ({heatcell: x, linecell: null}));

      singleEpochIndex = data[0].heatcell.indexInMultiSelection;
      dataOverallAccuracy = [];

      confMatrixRendererProto = {
        offdiagonal: [{renderer: 'HeatmapSingleEpochRenderer', params: [false, false]}],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}],
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      fpfnRendererProto = {
        diagonal: [{renderer: 'BarChartRenderer', params: null}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      lineChartRendererProto = {
        diagonal: [{renderer: 'BarChartRenderer', params: null}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };

    } else if (DataStoreApplicationProperties.renderMode === RenderMode.MULTI) {
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      data = multiEpochContent.map((x) => ({heatcell: null, linecell: x}));

      dataOverallAccuracy = datasets.map((x) => confMeasures.calcOverallAccuracy(x.multiEpochData.map((y) => y.confusionData)));
      singleEpochIndex = null;

      confMatrixRendererProto = {
        offdiagonal: [{
          renderer: 'HeatmapMultiEpochRenderer',
          params: [DataStoreApplicationProperties.transposeCellRenderer]
        }],
        diagonal: [{renderer: 'LabelCellRenderer', params: null}],
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      fpfnRendererProto = {
        diagonal: [{renderer: 'MatrixLineCellRenderer', params: null}], offdiagonal: null,
        functors: [this.setWeightUpdateListener, this.setYAxisScaleListener]
      };
      lineChartRendererProto = {
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
    this.renderOverallAccuracyCell(dataOverallAccuracy, lineChartRendererProto, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));

    this.updateSelectedCell();
    events.fire(AppConstants.EVENT_RENDER_CONF_MEASURE, datasets, singleEpochIndex, lineChartRendererProto, labelRendererProto);
  }

  private renderConfMatrixCells() {
    this.$cells.each((r) => r.render());
  }

  private renderOverallAccuracyCell(data: number[][], renderer: IMatrixRendererChain, labels: string[], singleEpochIndex: number[], colors: string[]) {
    const maxVal = Math.max(...[].concat(...data));
    const res = {
      linecell: data.map((x, i) => [{values: x, valuesInPercent: x, max: maxVal, classLabel: null, color: colors[i]}]),
      heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
    };
    const cell = new PanelCell(res, AppConstants.CELL_OVERALL_ACCURACY_SCORE, -1, -1);

    const $overallAccuracyCell = this.cellsBottomRight
      .append('div')
      .classed('cell', true)
      .datum(cell);

    cell.init($overallAccuracyCell);
    applyRendererChain(renderer, cell, renderer.diagonal);
    cell.render();
  }

  private renderFPFN(data: ICellData[], renderer: IMatrixRendererChain, singleEpochIndex: number[]) {
    const fpData = this.fpPanelData(data);
    const fnData = this.fnPanelData(data);

    const createCell = (type: string, data: ICellData[][], index: number) => {
      const confusionMatrixRow = data[index].map((x) => x);
      const lineCells = confusionMatrixRow.map((x) => x.linecell);
      const res = lineCells[index] !== null ? lineCells[0].map((_, i) => lineCells.map((elem, j) => lineCells[j][i])) : null;
      return new PanelCell({
        linecell: res,
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      }, type, index, -1);
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

  private fnPanelData(data: ICellData[]): ICellData[][] {
    data = data.slice(0);
    const arrays = [], size = AppConstants.CONF_MATRIX_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays;
  }

  private fpPanelData(data: ICellData[]): ICellData[][] {
    const res = [];
    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      res.push(data.filter((x, j) => j % AppConstants.CONF_MATRIX_SIZE === i));
    }
    return res;
  }

  private calcClassSizes(data: any) {
    if (data[0].length !== 0) {
      return confMeasures.calcForMultipleClasses(data[0][0].confusionData, confMeasures.ClassSize);
    } else if (data[1].length !== 0) {
      return confMeasures.calcForMultipleClasses(data[1][0].confusionData, confMeasures.ClassSize);
    }
    return null;
  }

  private setWeightUpdateListener(renderer: ACellRenderer) {
    renderer.addWeightFactorChangedListener();
  }

  private setYAxisScaleListener(renderer: ACellRenderer) {
    renderer.addYAxisScaleChangedListener();
  }

  private setInitialCell() {
    if (DataStoreCellSelection.getCell() === null) {
      simulateClick(this.cellsBottomRight.select('.cell').node());
    }
  }

  private setInitialToolbarStates() {
    events.fire(AppConstants.EVENT_UPDATE_TOOLBAR_STATE);
  }

  private updateSelectedCell() {
    const selectedCell = DataStoreCellSelection.getCell();
    if (selectedCell !== null) {
      if (selectedCell instanceof MatrixCell) {
        const newCell = d3.select(this.$cells[0][selectedCell.groundTruthIndex * AppConstants.CONF_MATRIX_SIZE + selectedCell.predictedIndex]).datum();
        DataStoreCellSelection.cellSelected(newCell);
      } else if (selectedCell instanceof PanelCell) {
        let newCell = null;
        if (selectedCell.type === AppConstants.CELL_FP) {
          newCell = d3.select(this.fpColumn.$node.selectAll('.cell')[0][selectedCell.panelColumnIndex]).datum();
        } else if (selectedCell.type === AppConstants.CELL_FN) {
          newCell = d3.select(this.fnColumn.$node.selectAll('.cell')[0][selectedCell.panelColumnIndex]).datum();
        } else if (selectedCell.type === AppConstants.CELL_OVERALL_ACCURACY_SCORE) {
          newCell = this.cellsBottomRight.select('.cell').datum();
        }
        DataStoreCellSelection.cellSelected(newCell);
      }
    }
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
