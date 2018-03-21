/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import {ACellRenderer, MatrixLineCellRenderer} from './confusion_matrix_cell/ACellRenderer';
import {Line, MatrixHeatCellContent} from './confusion_matrix_cell/CellContent';

export class ChartColumn {
  private curRenderer = null;
  constructor(public $node: d3.Selection<any>) {
    $node.classed('chart', true);
  }

  render(lineContent: {linecell: Line[], heatcell: MatrixHeatCellContent}, renderer: ACellRenderer) {
  }
}
