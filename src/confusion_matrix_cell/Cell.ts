import {Line, MatrixHeatCellContent} from './CellContent';
import {DataStoreCellSelection} from '../DataStore';
import {ACellRenderer} from './ACellRenderer';

/**
 * Created by Martin on 19.03.2018.
 */
export abstract class ACell {
  private _$node: d3.Selection<any>;
  public renderer: ACellRenderer;

  //abstract clear();
  constructor() {
    //
  }

  get $node(): d3.Selection<any> {
    return this._$node;
  }

  init($node: d3.Selection<any>) {
    this._$node = $node;
    this.attachListener($node);
  }

  protected attachListener($node: d3.Selection<any>) {
    $node.on('click', () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }

  public render() {
    this.renderer.renderNext(this);
  }
}

export class MatrixCell extends ACell {
  constructor(public data: {linecell: Line[][], heatcell: MatrixHeatCellContent},
    public predictedLabel: string, public groundTruthLabel: string,
    public predictedIndex: number, public groundTruthIndex: number) {
    super();
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: {label: string}) {
    super();
  }
}

export class PanelCell extends ACell {
  constructor(public data: {linecell: Line[][], heatcell: MatrixHeatCellContent},
    public type: string) {
    super();
  }
}
