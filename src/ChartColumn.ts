/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import {ACellRenderer} from './CellRenderer';
import {Matrix, IClassEvolution} from './DataStructures';

export class ChartColumn {
  private curRenderer = null;
  constructor(public $node: d3.Selection<any>) {
    $node.classed('chart', true);
  }

  render(renderer?: ACellRenderer) {
    this.curRenderer = renderer;
    renderer.renderCells();
  }

  clear() {
    if(this.curRenderer) {
      this.curRenderer.clearCells();
    }
  }
}
