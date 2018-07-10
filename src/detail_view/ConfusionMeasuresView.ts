/**
 * Created by Martin on 09.07.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {IAppView} from '../app';
import {AppConstants} from '../AppConstants';
import * as confMeasures from '../ConfusionMeasures';
import {applyRendererChain, IMatrixRendererChain} from '../confusion_matrix_cell/ACellRenderer';
import {ACell, LabelCell, PanelCell} from '../confusion_matrix_cell/Cell';
import {DataStoreApplicationProperties, RenderMode} from '../DataStore';
import {Matrix, max} from '../DataStructures';
import {Language} from '../language';
import {ILoadedMalevoDataset} from '../MalevoDataset';
import {zip} from '../utils';

export default class ConfusionMeasuresView implements IAppView {
  private $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent).append('table').classed('metrics-table-content', true);
    this.$node.append('thead').append('tr');
    this.$node.append('tbody');
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_RENDER_CONF_MEASURE, (evt, datasets: ILoadedMalevoDataset[], singleEpochIndex: number[], lineChartRendererProto: IMatrixRendererChain, labelRendererProto: IMatrixRendererChain) => {
      const {header, rows, rendererProtos} = this.prepareData(datasets, singleEpochIndex, lineChartRendererProto, labelRendererProto);
      this.renderTable(header, rows, rendererProtos);
    });

    //events.on(AppConstants.CLEAR_DETAIL_VIEW, () => {
    //this.$node.html('');
    //});
  }

  private prepareData(datasets: ILoadedMalevoDataset[], singleEpochIndex: number[], lineChartRendererProto: IMatrixRendererChain, labelRendererProto: IMatrixRendererChain) {
    let dataPrecision = null;
    let dataRecall = null;
    let dataF1 = null;

    if (DataStoreApplicationProperties.renderMode === RenderMode.SINGLE) {
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.PPV));
      dataRecall = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.TPR));
      dataF1 = datasets.map((x) => confMeasures.calcEvolution([x.singleEpochData.confusionData], confMeasures.F1));

    } else {
      dataPrecision = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.PPV));
      dataRecall = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.TPR));
      dataF1 = datasets.map((x) => confMeasures.calcEvolution(x.multiEpochData.map((y) => y.confusionData), confMeasures.F1));
    }

    const labels = this.renderClassLabels(datasets);
    const precisions = this.renderPrecisionColumn(dataPrecision, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));
    const recalls = this.renderRecallColumn(dataRecall, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));
    const f1Scores = this.renderF1ScoreColumn(dataF1, datasets[0].labels, singleEpochIndex, datasets.map((x) => x.datasetColor));
    const classSizes = this.renderClassSize(datasets);

    return {
      header: [Language.CLASS_LABELS, Language.PRECISION, Language.RECALL, Language.F1_SCORE, Language.CLASS_SIZE],
      rows: zip([labels, precisions, recalls, f1Scores, classSizes]),
      rendererProtos: [labelRendererProto, lineChartRendererProto, lineChartRendererProto, lineChartRendererProto, labelRendererProto]
    };
  }

  private renderClassLabels(datasets: ILoadedMalevoDataset[]): LabelCell[] {
    const classLabelData = datasets[0].labels;
    return classLabelData.map((datum) => {
      return new LabelCell({label: String(datum)});
    });
  }

  private renderF1ScoreColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[]): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{values: x, valuesInPercent: x, max: maxVal, classLabel: labels[index], color: colors[i]}]),
        heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
      };
      return new PanelCell(res, AppConstants.CELL_F1_SCORE);
    });
  }

  private renderRecallColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[]): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{values: x, valuesInPercent: x, max: maxVal, classLabel: labels[index], color: colors[i]}]),
        heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
      };
      return new PanelCell(res, AppConstants.CELL_RECALL);
    });
  }

  private renderPrecisionColumn(data: Matrix<number[]>[], labels: string[], singleEpochIndex: number[], colors: string[]): PanelCell[] {
    const maxVal = Math.max(...data.map((x: Matrix<number[]>) => max(x, (d) => Math.max(...d))));
    let transformedData = data.map((x) => x.to1DArray());
    transformedData = zip(transformedData);

    return transformedData.map((datum, index) => {
      const res = {
        linecell: datum.map((x, i) => [{values: x, valuesInPercent: x, max: maxVal, classLabel: labels[index], color: colors[i]}]),
        heatcell: {indexInMultiSelection: singleEpochIndex, counts: null, maxVal: 0, classLabels: null, colorValues: null}
      };
      return new PanelCell(res, AppConstants.CELL_PRECISION);
    });
  }

  private renderClassSize(datasets: ILoadedMalevoDataset[]): LabelCell[] {
    const classSizeData = datasets[0].classSizes;
    return classSizeData.map((datum) => {
      return new LabelCell({label: String(datum)});
    });
  }

  private renderTable(header: string[], rows: ACell[][], rendererProtos: IMatrixRendererChain[]) {
    const $header = this.$node.select('thead').selectAll('th').data(header);
    $header.enter().append('th').text((d) => d);
    $header.exit().remove();

    const $trs = this.$node.select('tbody').selectAll('tr').data(rows);
    $trs.enter().append('tr');

    const $tds = $trs.selectAll('td').data((d) => d);
    $tds.enter().append('td').each(function (cell, i) {
      cell.init(d3.select(this));
      applyRendererChain(rendererProtos[i], cell, rendererProtos[i].diagonal);
      cell.render();
      return null;
    });

    $tds.exit().remove();
    $trs.exit().remove();
  }

}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMeasuresView}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMeasuresView(parent);
}
