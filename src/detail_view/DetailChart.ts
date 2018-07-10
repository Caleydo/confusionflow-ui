import {DataStoreApplicationProperties, DataStoreCellSelection, RenderMode} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import {Language} from '../language';
import {ACell, DetailChartCell, MatrixCell, PanelCell} from '../confusion_matrix_cell/Cell';
import {
  ACellRenderer, applyRendererChain,
  AxisRenderer, IMatrixRendererChain, LineChartRenderer, removeListeners,
  VerticalLineRenderer
} from '../confusion_matrix_cell/ACellRenderer';
import * as events from 'phovea_core/src/event';

export class DetailChart {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private cell: ACell;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  public id: string = AppConstants.CHART_VIEW;
  public name: string = Language.CHART_VIEW;
  private $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent).append('div').classed('viewpanel-content', true);

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.$header = this.$node
      .append('div')
      .classed('chart-name', true);

    this.$svg = this.$node
      .append('svg')
      .style('width', '100%')
      .style('height', '400px')
      .attr('viewbox', `0 0 ${this.width} 500`);
  }

  init(): Promise<DetailChart> {
    this.$node.attr('id', this.id);
    this.attachListeners();
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_CELL_SELECTED + events.EventHandler.MULTI_EVENT_SEPARATOR + AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, () => {
      this.clear();
      this.render();
    });

    events.on(AppConstants.CLEAR_DETAIL_VIEW, () => {
      this.clear();
    });
  }

  createHeaderText = () => {
    this.$header.text('');
    let text = '';
    const cell = DataStoreCellSelection.getCell();
    if (cell instanceof MatrixCell) {
      const scaleType = DataStoreApplicationProperties.switchToAbsolute ? Language.NUMBER : Language.PERCENT;
      text = scaleType + ' ' + Language.CONFUSION_Y_LABEL;
      text = text + ' ' + Language.FOR_CLASS + ' ';
      text += cell.groundTruthLabel;
      text += ' with ';
      text += cell.predictedLabel;
    } else if (cell instanceof PanelCell) {
      if (cell.type === AppConstants.CELL_FP) {
        text = Language.FP_RATE;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_FN) {
        text = Language.FN_RATE;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_PRECISION) {
        text = Language.PRECISION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_RECALL) {
        text = Language.RECALL_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_F1_SCORE) {
        text = Language.F1_SCORE_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_OVERALL_ACCURACY_SCORE) {
        text = Language.OVERALL_ACCURACY;
      }
    }
    this.$header.text(text);
  }

  clear() {
    if (this.$g !== null) {
      this.$header.html('');
      this.$g.remove();
      this.$g = null;
      removeListeners(this.cell.renderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]);
    }
  }

  render() {
    const cell = DataStoreCellSelection.getCell();
    if (!cell) {
      return;
    }
    if (!(cell instanceof MatrixCell) && !(cell instanceof PanelCell)) {
      return;
    }
    if (cell.data.linecell === null) {
      return;
    }

    this.createHeaderText();
    const margin = {top: 5, right: 10, bottom: 140, left: 65}; // set left + bottom to show axis and labels
    this.width = (<any>this.$node[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>this.$node[0][0]).clientHeight - margin.top - margin.bottom;

    this.$g = this.$svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    this.$g.classed('linechart', true);

    this.cell = new DetailChartCell(cell);
    this.cell.init(this.$svg);
    this.cell.detachListener();

    let wfc = [(renderer: ACellRenderer) => renderer.addWeightFactorChangedListener(), (renderer: ACellRenderer) => renderer.addYAxisScaleChangedListener()];
    if (cell instanceof PanelCell && (cell.hasType([AppConstants.CELL_PRECISION, AppConstants.CELL_RECALL, AppConstants.CELL_F1_SCORE]))) {
      wfc = [];
    }

    const confMatrixRendererProto: IMatrixRendererChain = {diagonal: [{renderer: 'LineChartRenderer', params:[this.width, this.height]}, {renderer: 'AxisRenderer', params:[this.width, this.height]}, {renderer: 'VerticalLineRenderer',
      params:[this.width, this.height]}], offdiagonal: null, functors: wfc};

    applyRendererChain(confMatrixRendererProto , this.cell, confMatrixRendererProto.diagonal);
    this.cell.render();
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {DetailChartWindow}
 */
export function create(parent: Element, options: any) {
  return new DetailChart(parent);
}
