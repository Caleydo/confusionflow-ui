import {ACellRenderer} from '../CellRenderer';
import {Line, MatrixHeatCellContent} from './CellContent';

/**
 * Created by Martin on 19.03.2018.
 */
export class ACell {

  constructor(public data: {linecell: Line[], heatcell: MatrixHeatCellContent}, public $node: d3.Selection<any>) {

  }
 // abstract renderCells(renderer: ACellRenderer);
 // abstract clearCells();

  protected attachListener($cells: d3.Selection<any>) {
    $cells.on('click',  () => {
      const x = 0; // just to get rid of linter error
    });
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: {label: string}, public $node: d3.Selection<any>) {
    super(null, $node);
  }
}
