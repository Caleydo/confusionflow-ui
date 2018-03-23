import {ACellRenderer} from '../CellRenderer';
import {Line, MatrixHeatCellContent} from './CellContent';
import {DataStoreCellSelection2} from '../DataStore';

/**
 * Created by Martin on 19.03.2018.
 */
export class ACell {

  constructor(public $node: d3.Selection<any>) {
    this.attachListener($node);
  }
 // abstract renderCells(renderer: ACellRenderer);
 // abstract clearCells();

  protected attachListener($node: d3.Selection<any>) {
    $node.on('click',  () => {
      DataStoreCellSelection2.cellSelected(this);
    });
  }
}

export class MatrixCell extends ACell {
  constructor(public data: {linecell: Line[], heatcell: MatrixHeatCellContent}, public $node: d3.Selection<any>) {
    super($node);
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: {label: string}, public $node: d3.Selection<any>) {
    super($node);
  }
}

export class PanelCell extends ACell {
  constructor(public data: {linecell: Line[], heatcell: MatrixHeatCellContent}, public $node: d3.Selection<any>, public type: string) {
    super($node);
  }
}
