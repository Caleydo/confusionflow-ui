/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import { ICellData } from './ConfusionMatrix';
import { PanelCell, ACell } from './confusion_matrix_cell/Cell';
import { IMatrixRendererChain, applyRendererChain } from './confusion_matrix_cell/ACellRenderer';
import { AppConstants } from './AppConstants';


export enum EChartOrientation {
  COLUMN,
  ROW
}

/**
 * Represents a column/row along the confusion matrix
 */
export abstract class ChartColumn {

  constructor(public $node: d3.Selection<any>, public readonly orientation: EChartOrientation) {
    $node.classed('chart', true);
  }

  public render(data: ICellData[], rendererChain: IMatrixRendererChain, singleEpochIndex: number[]) {
    const panelCells = this.createPanelCells(data, singleEpochIndex);
    const { cellWidth, cellHeight } = this.cellSize(this.orientation, <HTMLElement>this.$node.node(), panelCells.length);

    this.$node
      .selectAll('div')
      .data(panelCells)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function (cell: ACell) {
        cell.init(d3.select(this), cellWidth, cellHeight);
        applyRendererChain(rendererChain, cell, rendererChain.diagonal);
        cell.render();
      });
  }

  protected abstract createPanelCells(data: ICellData[], singleEpochIndex: number[]): PanelCell[];

  protected createCell(type: string, data: ICellData[], index: number, singleEpochIndex: number[]): PanelCell {
    const confusionMatrixRow = data.map((x) => x);
    const lineCells = confusionMatrixRow.map((x) => x.linecell);
    const res = (lineCells[index] !== null) ? lineCells[0].map((_, i) => lineCells.map((elem, j) => lineCells[j][i])) : null;
    return new PanelCell({
      linecell: res,
      heatcell: {
        indexInMultiSelection: singleEpochIndex,
        counts: null,
        maxVal: 0,
        classLabels: null,
        colorValues: null
      }
    }, type, index, -1);
  };

  protected cellSize(orientation: EChartOrientation, node: HTMLElement, dataLength: number): { cellWidth: number, cellHeight: number } {
    switch (orientation) {
      case EChartOrientation.COLUMN:
        return {
          cellWidth: node.clientWidth,
          cellHeight: node.clientHeight / dataLength
        };

      case EChartOrientation.ROW:
        return {
          cellWidth: node.clientWidth / dataLength,
          cellHeight: node.clientHeight
        };
    }
    throw new Error('Unknown orientation. Cannot calculate cell size.');
  }
}

export class FPChartColumn extends ChartColumn {

  constructor(public $node: d3.Selection<any>, public readonly orientation: EChartOrientation) {
    super($node, orientation);
  }

  protected createPanelCells(data: ICellData[], singleEpochIndex: number[]): PanelCell[] {
    const res = [];
    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      res.push(data.filter((_, j) => j % AppConstants.CONF_MATRIX_SIZE === i));
    }
    return res.map((d: ICellData[], index) => this.createCell(AppConstants.CELL_FP, d, index, singleEpochIndex));
  }
}

export class FNChartColumn extends ChartColumn {

  constructor(public $node: d3.Selection<any>, public readonly orientation: EChartOrientation) {
    super($node, orientation);
  }

  protected createPanelCells(data: ICellData[], singleEpochIndex: number[]): PanelCell[] {
    data = data.slice(0);
    const arrays = [], size = AppConstants.CONF_MATRIX_SIZE;
    while (data.length > 0) {
      arrays.push(data.splice(0, size));
    }
    return arrays.map((d: ICellData[], index) => this.createCell(AppConstants.CELL_FP, d, index, singleEpochIndex));
  }
}
