import {Line, MatrixHeatCellContent} from './CellContent';
import {DataStoreCellSelection} from '../DataStore';

/**
 * Created by Martin on 19.03.2018.
 */
export abstract class ACell {
  //abstract clear();
  constructor(public $node: d3.Selection<any>) {
    this.attachListener($node);
  }

  protected attachListener($node: d3.Selection<any>) {
    $node.on('click',  () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }
}

export class MatrixCell extends ACell {
  constructor(public data: {linecell: Line[][], heatcell: MatrixHeatCellContent}, public $node: d3.Selection<any>,
              public predictedLabel: string, public groundTruthLabel: string,
              public predictedIndex: number, public groundTruthIndex: number) {
    super($node);
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: {label: string}, public $node: d3.Selection<any>) {
    super($node);
  }
}

export class PanelCell extends ACell {
  constructor(public data: {linecell: Line[][], heatcell: MatrixHeatCellContent},
              public $node: d3.Selection<any>,
              public type: string) {
    super($node);
  }
}
