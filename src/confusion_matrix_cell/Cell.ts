import { Line, MatrixHeatCellContent } from './CellContent';
import { DataStoreCellSelection } from '../DataStore';
import { ACellRenderer } from './ACellRenderer';

/**
 * Represents a cell in the confusin matrix
 */
export abstract class ACell {
  private _$node: d3.Selection<any>;
  private _width: number;
  private _height: number;
  public renderer: ACellRenderer;

  constructor() {
    //
  }

  get $node(): d3.Selection<any> {
    return this._$node;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  init($node: d3.Selection<any>, width: number = -1, height: number = -1) {
    this._$node = $node;
    this._width = (width < 0) ? (<HTMLElement>$node.node()).clientWidth : width;
    this._height = (height < 0) ? (<HTMLElement>$node.node()).clientHeight : height;
    this.attachListener();
  }

  protected attachListener() {
    this._$node.on('click', () => {
      if (this instanceof MatrixCell || this instanceof PanelCell) {
        DataStoreCellSelection.cellSelected(this);
      }
    });
  }

  public render() {
    this.renderer.renderNext(this);
  }
}

export class MatrixCell extends ACell {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public predictedLabel: string, public groundTruthLabel: string,
    public predictedIndex: number, public groundTruthIndex: number) {
    super();
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: { label: string }) {
    super();
  }
}

export class PanelCell extends ACell {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public type: string, public panelColumnIndex: number, public panelRowIndex: number) {
    super();
  }

  hasType(types: string[]) {
    return types.includes(this.type);
  }
}

export class MetricsPanelCell extends PanelCell {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public type: string, public panelColumnIndex: number, public panelRowIndex: number) {
    super(data, type, panelColumnIndex, panelRowIndex);
  }

  hasType(types: string[]) {
    return types.includes(this.type);
  }
}

export class DetailChartCell extends ACell {
  public data: { linecell: Line[][], heatcell: MatrixHeatCellContent };

  constructor(public child: MatrixCell | PanelCell) {
    super();
    this.data = child.data;
  }
}
