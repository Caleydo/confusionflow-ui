import { Line, MatrixHeatCellContent } from './CellContent';
import { DataStoreCellSelection, DataStoreApplicationProperties } from '../DataStore';
import { ACellRenderer } from './ACellRenderer';
import { AppConstants } from '../AppConstants';
import * as events from 'phovea_core/src/event';

/**
 * Represents a cell in the confusin matrix
 */
export abstract class ACell {
  protected _$node: d3.Selection<any>;
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

  protected abstract attachListener();

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

  protected attachListener() {
    this._$node.on('mouseover', () => {
      const cell = DataStoreCellSelection.getCell();
      if (cell instanceof PanelCell) {
        if (cell.type === 'cellFN') {
          const panelClassLabel = cell.data.linecell[0][0].groundTruthLabel;
          if (panelClassLabel === this.groundTruthLabel) {
            DataStoreApplicationProperties.highlightedPredictedClass = this.predictedLabel;
            DataStoreApplicationProperties.highlightedGroundTruthClass = this.groundTruthLabel;
            console.log(DataStoreApplicationProperties.highlightedGroundTruthClass, DataStoreApplicationProperties.highlightedPredictedClass);
            DataStoreApplicationProperties.toggleHighLighting();
            events.fire(AppConstants.EVENT_MATRIX_CELL_HOVERED);
          }
        } else if (cell.type === 'cellFP') {
          const panelClassLabel = cell.data.linecell[0][0].predictedLabel;
          if (panelClassLabel === this.predictedLabel) {
            DataStoreApplicationProperties.highlightedPredictedClass = this.predictedLabel;
            DataStoreApplicationProperties.highlightedGroundTruthClass = this.groundTruthLabel;
            console.log(DataStoreApplicationProperties.highlightedGroundTruthClass, DataStoreApplicationProperties.highlightedPredictedClass);
            DataStoreApplicationProperties.toggleHighLighting();
            events.fire(AppConstants.EVENT_MATRIX_CELL_HOVERED);
          }
        }
      }
    });

    this._$node.on('click', () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }
}

export class LabelCell extends ACell {
  constructor(public labelData: { label: string }) {
    super();
  }

  protected attachListener() {
    // not used
  };
}

export class PanelCell extends ACell {
  constructor(public data: { linecell: Line[][], heatcell: MatrixHeatCellContent },
    public type: string, public panelColumnIndex: number, public panelRowIndex: number) {
    super();
  }

  hasType(types: string[]) {
    return types.includes(this.type);
  }

  protected attachListener() {
    this._$node.on('click', () => {
      DataStoreCellSelection.cellSelected(this);
    });
  }
}

export class DetailChartCell extends ACell {
  public data: { linecell: Line[][], heatcell: MatrixHeatCellContent };

  constructor(public child: MatrixCell | PanelCell) {
    super();
    this.data = child.data;
  }

  protected attachListener() {
    // not used
  };
}
