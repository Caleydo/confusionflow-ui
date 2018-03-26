import {ADetailViewTab} from './ADetailViewTab';
import {DataStoreCellSelection, DataStoreTimelineSelection} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassEvolution, max} from '../DataStructures';
import {Language} from '../language';
import {App} from '../app';
import {MatrixCell, PanelCell} from '../confusion_matrix_cell/Cell';
import {
  AxisRenderer, DetailViewRenderer, MatrixLineCellRenderer,
  VerticalLineRenderer
} from '../confusion_matrix_cell/ACellRenderer';

export class DetailChartTab extends ADetailViewTab {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  public id: string = AppConstants.CHART_VIEW;
  public name: string = Language.CHART_VIEW;

  constructor(parent: Element) {
    super(parent);

    this.width = parent.clientWidth;
    this.height = parent.clientHeight;

    this.$header = this.$node
      .append('div')
      .classed('chart-name', true);

    this.$svg = this.$node
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} 500`);
  }

  init(): Promise<DetailChartTab> {
    this.$node.attr('id', this.id);
    return Promise.resolve(this);
  }

  createHeaderText() {
    let text = '';
    if(DataStoreCellSelection.cell instanceof MatrixCell) {
      text = Language.CONFUSION_Y_LABEL;
      text = text + ' ' + Language.FOR_CLASS + ' ';
      text += DataStoreCellSelection.cell.groundTruthLabel;
      text += ' with ';
      text += DataStoreCellSelection.cell.predictedLabel;
    } else if(DataStoreCellSelection.cell instanceof PanelCell) {
      if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_FP) {
        text = Language.FP_RATE;
      } else if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_FN) {
        text = Language.FN_RATE;
      } else if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_PRECISION) {
        text = Language.PRECISION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += DataStoreCellSelection.cell.data.linecell[0][0].classLabel;
      }
    }
    this.$header.text(text);
  }

  clear() {
	  if(this.$g !== null) {
		  this.$g.remove();
		  this.$g = null;
	  }
  }

  render() {
    if(!DataStoreCellSelection.cell) {
      return;
    }
    if(!(DataStoreCellSelection.cell instanceof MatrixCell) && !(DataStoreCellSelection.cell instanceof PanelCell)) {
      return;
    }
    const cell = DataStoreCellSelection.cell;
    if(cell.data.linecell === null) {
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

    const detailViewCell = new MatrixCell(cell.data, this.$svg, '', '', 0, 0);
    const renderer = new DetailViewRenderer(this.width, this.height);
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
export function create(parent:Element, options:any) {
  return new DetailChartTab(parent);
}
