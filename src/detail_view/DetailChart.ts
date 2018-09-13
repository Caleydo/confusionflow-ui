import { DataStoreApplicationProperties, DataStoreCellSelection, ERenderMode } from '../DataStore';
import { AppConstants } from '../AppConstants';
import * as d3 from 'd3';
import { Language } from '../language';
import { ACell, DetailChartCell, MatrixCell, PanelCell } from '../confusion_matrix_cell/Cell';
import {
  ACellRenderer, applyRendererChain,
  AxisRenderer, IMatrixRendererChain, LineChartRenderer, removeListeners,
  VerticalLineRenderer,
  ERenderer,
  MatrixLineCellRenderer
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

    events.on(AppConstants.EVENT_CLEAR_DETAIL_CHART, () => {
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
        text = DataStoreApplicationProperties.switchToAbsolute ? Language.FP_NUM : Language.FP_RATES; 
        text = text + ' ' + Language.FOR_ALLCLASS + ' ' + Language.PREDICTED_AS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      } else if (cell.type === AppConstants.CELL_FN) {
        text = DataStoreApplicationProperties.switchToAbsolute ? Language.FN_NUM : Language.FN_RATES;
        text = text + ' ' + Language.FOR_ALLCLASS + ' ' + Language.GIVEN + ' ';
        // hack for getting the ground-truth class label:
        // - as the diagonal cells are empty for each ground-truth row we simply check for the empty array and return the class label
        const classlabelIndex = cell.data.linecell[0].map(d => (d.values.length == 0) ? d.classLabel : null).filter(x => x); 
        text += classlabelIndex[0];
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
      } else if (cell.type === AppConstants.CELL_CLASS_SIZE) {
        text = Language.CLASS_SIZE;
      }
    }
    this.$header.text(text);
  }

  private clear() {
    if (this.$g !== null) {
      this.$header.html('');
      this.$g.remove();
      this.$g = null;
      removeListeners(this.cell.renderer, [(r: ACellRenderer) => r.removeWeightFactorChangedListener(), (r: ACellRenderer) => r.removeYAxisScaleChangedListener()]);
    }
  }

  private render() {
    const cell = DataStoreCellSelection.getCell();
    if (!cell) {
      return;
    }
    if (!(cell instanceof MatrixCell) && !(cell instanceof PanelCell)) {
      return;
    }
    if (DataStoreApplicationProperties.renderMode === ERenderMode.SINGLE) {
      return;
    }

    this.createHeaderText();
    const margin = { top: 5, right: 10, bottom: 140, left: 65 }; // set left + bottom to show axis and labels
    const width = this.width - margin.left - margin.right;
    const height = this.height - margin.top - margin.bottom;

    this.$g = this.$svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    this.$g.classed('linechart', true);

    this.cell = new DetailChartCell(cell);
    this.cell.init(this.$svg, width, height);

    let confMatrixRendererProto: IMatrixRendererChain = null;
    if (cell instanceof PanelCell && cell.hasType([AppConstants.CELL_CLASS_SIZE])) {
      confMatrixRendererProto = {
        diagonal: [
          { renderer: ERenderer.BarChart, params: [this.$g] },
          { renderer: ERenderer.BarAxis, params: [] }
        ],
        offdiagonal: null,
        functors: []
      };
    } else {
      let wfc = [(renderer: ACellRenderer) => renderer.addWeightFactorChangedListener(), (renderer: ACellRenderer) => renderer.addYAxisScaleChangedListener()];
      if (cell instanceof PanelCell && (cell.hasType([AppConstants.CELL_PRECISION, AppConstants.CELL_RECALL, AppConstants.CELL_F1_SCORE]))) {
        wfc = [];
      }
      confMatrixRendererProto = {
        diagonal: [
          { renderer: ERenderer.LineChart, params: [] },
          { renderer: ERenderer.Axis, params: [] },
          { renderer: ERenderer.VerticalLine, params: [] }
        ],
        offdiagonal: null,
        functors: wfc
      };
    }

    applyRendererChain(confMatrixRendererProto, this.cell, confMatrixRendererProto.diagonal);
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
