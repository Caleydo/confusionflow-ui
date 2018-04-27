import {ADetailViewTab} from './ADetailViewTab';
import {DataStoreApplicationProperties, DataStoreCellSelection} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import {Language} from '../language';
import {MatrixCell, PanelCell} from '../confusion_matrix_cell/Cell';
import {
  AxisRenderer, LinechartRenderer,
  VerticalLineRenderer
} from '../confusion_matrix_cell/ACellRenderer';
import * as events from 'phovea_core/src/event';

export class DetailChartTab extends ADetailViewTab {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  private $slider: d3.Selection<any> = null;
  public id: string = AppConstants.CHART_VIEW;
  public name: string = Language.CHART_VIEW;

  constructor(parent: Element) {
    super(parent);

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.$header = this.$node
      .append('div')
      .classed('chart-name', true);

    this.$slider = this.$node.html(`
    <div class="chart-container">
      <input type="range" min="1" max="10" value="1" class="slider" id="myRange">
      <svg viewBox="0 0 ${this.width} 500"/>
    </div>`);

    this.$svg = this.$node.select('svg');
    this.$slider = this.$node.select('input');
    this.$slider.on('input', function() {
      DataStoreApplicationProperties.updateWeightFactor(this.value / 10);
    });
  }

  init(): Promise<DetailChartTab> {
    this.$node.attr('id', this.id);
    return Promise.resolve(this);
  }


  createHeaderText() {
    let text = '';
    const cell = DataStoreCellSelection.getCell();
    if (cell instanceof MatrixCell) {
      text = Language.CONFUSION_Y_LABEL;
      text = text + ' ' + Language.FOR_CLASS + ' ';
      text += cell.groundTruthLabel;
      text += ' with ';
      text += cell.predictedLabel;
    } else if (cell instanceof PanelCell) {
      if (cell.type === AppConstants.CELL_FP) {
        text = Language.FP_RATE;
      } else if (cell.type === AppConstants.CELL_FN) {
        text = Language.FN_RATE;
      } else if (cell.type === AppConstants.CELL_PRECISION) {
        text = Language.PRECISION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += cell.data.linecell[0][0].classLabel;
      }
    }
    this.$header.text(text);
  }

  clear() {
    if (this.$g !== null) {
      this.$g.remove();
      this.$g = null;
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
    const multiEpochData = cell.data.linecell;

    this.createHeaderText();
    const margin = {top: 5, right: 10, bottom: 140, left: 65}; // set left + bottom to show axis and labels
    this.width = (<any>this.$node[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>this.$node[0][0]).clientHeight - margin.top - margin.bottom;
    if (this.$g !== null) {
      this.$g.remove();
    }

    this.$g = this.$svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    this.$g.classed('linechart', true);

    const detailViewCell = new MatrixCell(cell.data, '', '', 0, 0);
    detailViewCell.init(this.$svg);
    const renderer = new LinechartRenderer(this.width, this.height);
    renderer
      .setNextRenderer(new AxisRenderer(this.width, this.height))
      .setNextRenderer(new VerticalLineRenderer(this.width, this.height));
    renderer.renderNext(detailViewCell);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {DetailChartWindow}
 */
export function create(parent: Element, options: any) {
  return new DetailChartTab(parent);
}
