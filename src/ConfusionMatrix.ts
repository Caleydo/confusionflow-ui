import {IAppView} from './app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoEpochInfo, ILoadedMalevoEpoch, ILoadedMalevoDataset} from './MalevoDataset';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {ITable} from 'phovea_core/src/table';
import {ChartColumn} from './ChartColumn';
import {
  ACellRenderer, MatrixLineCellRenderer,
  VerticalLineRenderer, BarChartRenderer, LabelCellRenderer, HeatmapMultiEpochRenderer, HeatmapSingleEpochRenderer,
  SingleEpochMarker
} from './confusion_matrix_cell/ACellRenderer';
import {ACell, LabelCell, MatrixCell, PanelCell} from './confusion_matrix_cell/Cell';
import {zip} from './utils';
import * as confMeasures from './ConfusionMeasures';
import {Language} from './language';
import {SquareMatrix, max, Matrix} from './DataStructures';
import {
  DataStoreApplicationProperties, dataStoreTimelines,
  DataStoreTimelineSelection
} from './DataStore';
import {
  SingleEpochCalculator, Line, MultiEpochCalculator, MatrixHeatCellContent
} from './confusion_matrix_cell/CellContent';


enum RenderMode {
  CLEAR = 0,
  SINGLE = 1,
  MULTI = 2,
  COMBINED = 3
}

export interface ICellData {
  linecell: Line[];
  heatcell: MatrixHeatCellContent;
}

interface IRendererChain {
  offdiagonal: ACellRenderer[];
  diagonal: ACellRenderer[];
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
      .text(Language.FP);

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
      .attr('data-aspect-ratio', 'one-by-one');

    this.$confusionMatrix = $mwrapper.append('div').classed('matrix', true);

    const $chartRight = this.$node.append('div').classed('chart-right', true);
    this.fnColumn = new ChartColumn($chartRight.append('div'));
    this.precisionColumn = new ChartColumn($chartRight.append('div'));
    this.classSizeColumn = new ChartColumn($chartRight.append('div'));

    const $chartBottom = this.$node.append('div').classed('chart-bottom', true);
    this.fpColumn = new ChartColumn($chartBottom.append('div'));

    this.createTransposeCellsDiv($mwrapper);
    this.createSwitchCellsVisDiv();
  }

  private createSwitchCellsVisDiv() {
    const $switchCellsVisDiv = this.$node.append('div')
      .classed('cfm-switch-cell-vis', true)
      .html(`
        <input type="checkbox" id="switch-cell-renderer">
      `);

    $switchCellsVisDiv.select('input').on('change', () => {
      const switched = DataStoreApplicationProperties.toggleSwitchCellRenderer();

      this.$cells.each((c) => {
        let currentMatrixRenderer = (<any>c.renderer);
        while (currentMatrixRenderer !== null) {
          if (currentMatrixRenderer instanceof HeatmapMultiEpochRenderer && switched) {
            c.renderer = new MatrixLineCellRenderer();
            if (this.renderMode === RenderMode.COMBINED) {
              c.renderer.setNextRenderer(new HeatmapSingleEpochRenderer(false, true))
                .setNextRenderer(new VerticalLineRenderer(-1, -1));
            }
            this.$node.select('div .cfm-transpose-cell').style('display', 'none');
            break;
          } else if (currentMatrixRenderer instanceof MatrixLineCellRenderer && !switched) {
            c.renderer = new HeatmapMultiEpochRenderer(DataStoreApplicationProperties.transposeCellRenderer);
            if (this.renderMode === RenderMode.COMBINED) {
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

  private createTransposeCellsDiv($mwrapper: d3.Selection<any>) {
    const $transposeCellsDiv = this.$node.append('div')
      .classed('cfm-transpose-cell', true)
      .html(`
        <input type="checkbox" class="sr-only" id="transpose-cell-renderer">
        <label for="transpose-cell-renderer" title="Transpose matrix visualization">
          <span class="sr-only">Change direction of </span><span>epochs</span>
        </label>
      `);

    $transposeCellsDiv.select('input').on('change', () => {
      const isTransposed = DataStoreApplicationProperties.toggleTransposeCellRenderer();
      $mwrapper.classed('transpose-cells', isTransposed);

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
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_REDRAW, (evt) => {
      this.clearDetailView();
      this.updateViews();
    });
  }

  private createCellRenderers(renderProto: IRendererChain) {
    this.$cells.each((datum, index) => {
      const target = index % 11 !== 0 ? renderProto.offdiagonal : renderProto.diagonal;
      datum.renderer = target.reduce((acc, val) => {
        const copy = Object.create(val);
        if(acc === null) {
          return copy;
        }
        acc.setNextRenderer(copy);
        return acc;
      }, null);
    });
  }


  clearDetailView() {
    events.fire(AppConstants.CLEAR_DETAIL_VIEW);
  }

  chooseRenderMode(datasets: ILoadedMalevoDataset[]) {
    this.renderMode = RenderMode.CLEAR;

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
        this.renderMode |= RenderMode.SINGLE;
        return;
      }
    });

    // if at least one multi epoch selection exist
    // => update render mode
    datasets.forEach((x) => {
      if (multiEpochDataExists(x)) {
        // tslint:disable-next-line:no-bitwise
        this.renderMode |= RenderMode.MULTI;
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
          return {multiEpochData: <ILoadedMalevoEpoch[]>d[0], singleEpochData: <ILoadedMalevoEpoch>d[1][0], labels: <string[]>d[2], datasetColor: <string>d[3]};
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
      .text((datum: string) => datum);

    $cells.exit().remove();
  }

  private removeConfusionMatrixCells() {
    this.$confusionMatrix
      .selectAll('div')
      .remove();
  }

  private removeConfusionMatrixCellsContent() {
    this.$confusionMatrix
      .selectAll('div')
      .html('');
  }

  renderCells(datasets: ILoadedMalevoDataset[]) {
    this.removeConfusionMatrixCells();

    this.fpColumn.$node.selectAll('div').remove();
    this.fnColumn.$node.selectAll('div').remove();
    this.precisionColumn.$node.selectAll('div').remove();
    this.classSizeColumn.$node.selectAll('div').remove();

    if (this.renderMode === RenderMode.CLEAR) {
      return;
    }

    let singleEpochContent = null;
    let multiEpochContent = null;

    let data: ICellData[] = null;
    let datafpfn = null;
    let dataPrecision = null;

    let fpfnRenderer = null;

    let singleEpochIndex = null;
    let renderProto: IRendererChain;
    if (this.renderMode === RenderMode.COMBINED) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      const zippedData = zip([singleEpochContent, multiEpochContent]);
      data = zippedData.map((x) => ({heatcell: x[0], linecell: x[1]}));

      datafpfn = multiEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = data[1].heatcell.indexInMultiSelection;

      renderProto = {offdiagonal: [new HeatmapMultiEpochRenderer(DataStoreApplicationProperties.transposeCellRenderer), new SingleEpochMarker(DataStoreApplicationProperties.transposeCellRenderer)],
        diagonal: [new LabelCellRenderer()]};
      //this.matrixRenderer = new HeatmapMultiEpochRenderer(DataStoreApplicationProperties.transposeCellRenderer);
      //this.matrixRenderer.setNextRenderer(new SingleEpochMarker(DataStoreApplicationProperties.transposeCellRenderer));
      fpfnRenderer = new MatrixLineCellRenderer();
      fpfnRenderer.setNextRenderer(new VerticalLineRenderer(-1, -1));

    } else if (this.renderMode === RenderMode.SINGLE) {
      singleEpochContent = new SingleEpochCalculator().calculate(datasets);
      data = singleEpochContent.map((x) => ({heatcell: x, linecell: null}));

      datafpfn = singleEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.PPV));
      singleEpochIndex = data[0].heatcell.indexInMultiSelection;

      renderProto = {offdiagonal: [new HeatmapSingleEpochRenderer(false, false)], diagonal: [new LabelCellRenderer()]};
      fpfnRenderer = new BarChartRenderer();

    } else if (this.renderMode === RenderMode.MULTI) {
      multiEpochContent = new MultiEpochCalculator().calculate(datasets);
      data = multiEpochContent.map((x) => ({heatcell: null, linecell: x}));

      datafpfn = multiEpochContent;
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      singleEpochIndex = null;

      renderProto = {offdiagonal: [new HeatmapMultiEpochRenderer(DataStoreApplicationProperties.transposeCellRenderer)],
        diagonal: [new LabelCellRenderer()]};
      fpfnRenderer = new MatrixLineCellRenderer();
    }

    const that = this;

    const cellData = data.map((d, index) => {
      const groundTruth = Math.floor(index / that.CONF_SIZE);
      if(index % 11 === 0) {
        return new LabelCell({label: datasets[0].labels[groundTruth]});
      }
      const lineCellContent = data[index].linecell !== null ? data[index].linecell.map((x) => [x]) : null;
      const res = {linecell: lineCellContent, heatcell: data[index].heatcell};
      const predicted = index % that.CONF_SIZE;
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

    this.createCellRenderers(renderProto);
    this.renderConfMatrixCells();

    this.renderFPFN(data, fpfnRenderer, singleEpochIndex);
    this.renderClassSize(datasets, new LabelCellRenderer());
    this.renderPrecisionColumn(dataPrecision, fpfnRenderer, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));
  }

  private renderConfMatrixCells() {
    this.$cells.each((r) => r.render());
  }

  renderPrecisionColumn(data: Matrix<number[]>[], renderer: ACellRenderer, labels: string[], singleEpochIndex: number[], colors: string[]) {
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
          linecell: datum.map((x, i) => [{values: x, max: maxVal, classLabel: labels[index], color: colors[i]}]),
          heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
        };
        const cell = new PanelCell(res, AppConstants.CELL_PRECISION);
        cell.init(d3.select(this));
        renderer.renderNext(cell);
      });
  }

  renderFPFN(data: ICellData[], renderer: ACellRenderer, singleEpochIndex: number[]) {
    const fpData = this.fpPanelData(data);
    const fnData = this.fnPanelData(data);

    const render = (type: string, data: ICellData[][], index: number, $div: d3.Selection<any>) => {
      const confusionMatrixRow = data[index].map((x) => x);
      const lineCells = confusionMatrixRow.map((x) => x.linecell);
      const res = lineCells[index] !== null ? lineCells[0].map((_, i) => lineCells.map((elem, j) => lineCells[j][i])) : null;
      const cell = new PanelCell({
        linecell: res,
        heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
      }, type);
      cell.init($div);
      renderer.renderNext(cell);
    };

    this.fpColumn.$node
      .selectAll('div')
      .data(fpData.map(() => 0))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        render(AppConstants.CELL_FP, fpData, index, d3.select(this));
      });

    this.fnColumn.$node
      .selectAll('div')
      .data(fnData.map(() => 0))
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (datum, index) {
        render(AppConstants.CELL_FN, fnData, index, d3.select(this));
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
      .each(function (datum: number, index: number) {
        const cell = new LabelCell({label: String(datum)});
        cell.init(d3.select(this));
        renderer.renderNext(cell);
      });
  }

  fnPanelData(data: ICellData[]): ICellData[][]  {
    data = data.slice(0);
    const arrays = [], size = this.CONF_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays;
  }

  fpPanelData(data: ICellData[]): ICellData[][] {
    const res = [];
    for (let i = 0; i < this.CONF_SIZE; i++) {
      res.push(data.filter((x, j) => j % this.CONF_SIZE === i));
    }
    return res;
  }

  classSizeData(datasets: ILoadedMalevoDataset[]) {
    if (datasets[0].singleEpochData) {
      return confMeasures.calcForMultipleClasses(datasets[0].singleEpochData.confusionData, confMeasures.ClassSize);
    }
    return confMeasures.calcForMultipleClasses(datasets[0].multiEpochData[0].confusionData, confMeasures.ClassSize);
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
