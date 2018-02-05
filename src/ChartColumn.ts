/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import {ICellRenderer} from './CellRenderer';

export class ChartColumn {

  constructor(private $node: d3.Selection<any>) {
    $node.classed('chart', true);
  }

  render(renderer: ICellRenderer) {
    renderer.renderCells(this.$node);
  }
}
