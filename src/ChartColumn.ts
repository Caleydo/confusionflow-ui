/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import {ACellRenderer, MatrixLineCellRenderer} from './confusion_matrix_cell/ACellRenderer';
import {ACell} from './confusion_matrix_cell/Cell';
import {ICellData} from './ConfusionMatrix';

/**
 * Represents a column/row along the confusion matrix
 */
export class ChartColumn {
  private curRenderer = null;
  constructor(public $node: d3.Selection<any>) {
    $node.classed('chart', true);
  }

  render(lineContent: ICellData, renderer: ACellRenderer) {
    const x = 0;
  }
}
