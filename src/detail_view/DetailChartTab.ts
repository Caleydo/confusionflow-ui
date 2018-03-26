import {ADetailViewTab} from './ADetailViewTab';
import {DataStoreCellSelection, DataStoreCellSelection2, DataStoreTimelineSelection} from '../DataStore';
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

function addDashedLines($g: d3.Selection<any>, x: any, singleEpochIndex: number, height: number, width: number) {
  const $line = $g.append('line').attr('y1', 0).attr('y2', height);
  $line.classed('dashed-lines', true);
  $line.attr('x1', x(singleEpochIndex) + borderOffset($line, x(singleEpochIndex), width)).attr('x2', x(singleEpochIndex) + borderOffset($line, x(singleEpochIndex), width));
}

function borderOffset($line: d3.Selection<any>, posX: number, width: number) {
  let sw = parseInt($line.style('stroke-width'), 10);
  sw /= 2;
  if(posX === 0) {
    return sw;
  } else if(posX === width) {
    return -sw;
  }
  return 0;
}

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
    if(DataStoreCellSelection2.cell instanceof MatrixCell) {
      text = Language.CONFUSION_Y_LABEL;
      text = text + ' ' + Language.FOR_CLASS + ' ';
      text += DataStoreCellSelection2.cell.groundTruthLabel;
      text += ' with ';
      text += DataStoreCellSelection2.cell.predictedLabel;
    } else if(DataStoreCellSelection2.cell instanceof PanelCell) {
      if(DataStoreCellSelection2.cell.type ===  AppConstants.CELL_FP) {
        text = Language.FP_RATE;
      } else if(DataStoreCellSelection2.cell.type ===  AppConstants.CELL_FN) {
        text = Language.FN_RATE;
      } else if(DataStoreCellSelection2.cell.type ===  AppConstants.CELL_PRECISION) {
        text = Language.PRECISION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += DataStoreCellSelection2.cell.data.linecell[0][0].classLabel;
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
    if(!DataStoreCellSelection2.cell) {
      return;
    }
    if(!(DataStoreCellSelection2.cell instanceof MatrixCell) && !(DataStoreCellSelection2.cell instanceof PanelCell)) {
      return;
    }
    const cell = DataStoreCellSelection2.cell;
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
