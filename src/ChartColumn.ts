/**
 * Created by Martin on 27.01.2018.
 */
import * as d3 from 'd3';
import { ICellData } from './ConfusionMatrix';
import { PanelCell, ACell } from './confusion_matrix_cell/Cell';
import {
  IMatrixRendererChain,
  applyRendererChain
} from './confusion_matrix_cell/ACellRenderer';
import { AppConstants } from './AppConstants';
import { DataStoreApplicationProperties } from './DataStore';

export enum EChartOrientation {
  COLUMN,
  ROW
}

/**
 * Represents a column/row along the confusion matrix
 */
export abstract class ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    $node.classed('chart', true);
  }

  public render(
    data: ICellData[],
    rendererChain: IMatrixRendererChain,
    singleEpochIndex: number[]
  ) {
    const panelCells = this.createPanelCells(data, singleEpochIndex);
    const cellSize = DataStoreApplicationProperties.confMatrixCellSize;

    this.$node
      .selectAll('div')
      .data(panelCells)
      .enter()
      .append('div')
      .classed('cell', true)
      .each(function(cell: ACell) {
        cell.init(d3.select(this), cellSize[0], cellSize[1]);
        applyRendererChain(rendererChain, cell, rendererChain.diagonal);
        cell.render();
      });
  }

  protected abstract createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[];

  protected createCell(
    type: string,
    data: ICellData[],
    index: number,
    singleEpochIndex: number[]
  ): PanelCell {
    const confusionMatrixRow = data.map((x) => x);
    const lineCells = confusionMatrixRow.map((x) => x.linecell);
    const res =
      lineCells[index] !== null
        ? lineCells[0].map((_, i) =>
            lineCells.map((elem, j) => lineCells[j][i])
          )
        : null;
    return new PanelCell(
      {
        linecell: res,
        heatcell: {
          indexInMultiSelection: singleEpochIndex,
          counts: null,
          maxVal: 0,
          classLabels: null,
          colorValues: null
        }
      },
      type,
      index,
      -1
    );
  }
}

export class FPChartColumn extends ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    super($node, orientation);
  }

  protected createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[] {
    const resTmp = [];
    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      resTmp.push(
        data.filter((_, j) => j % AppConstants.CONF_MATRIX_SIZE === i)
      );
    }

    // Don't overwrite origina data
    const res = JSON.parse(JSON.stringify(resTmp));

    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      // Get number of runs
      let numRuns = 0;
      res[i]
        .map((d) => d['linecell'].length)
        .map((d) => {
          numRuns = Math.max(d, numRuns);
        });

      const runsValues = Array.from(
        new Array(numRuns),
        (x, i) => i
      ).map((d) => []);
      const runsPercentage = Array.from(
        new Array(numRuns),
        (x, i) => i
      ).map((d) => []);

      let maxValue = 0;

      res[i].map((d) => {
        d['linecell'].map((x, j) => {
          if (runsValues[j].length === 0) {
            runsValues[j] = x['values'];
            runsPercentage[j] = x['valuesInPercent'];
          } else {
            if (x['values'].length !== 0) {
              runsValues[j] = runsValues[j].map(
                (val, valIndex) => val + x['values'][valIndex]
              );
              runsPercentage[j] = runsPercentage[j].map(
                (val, valIndex) => val + x['valuesInPercent'][valIndex]
              );
            }
          }
          x['values'] = [];
          x['valuesInPercent'] = [];
          maxValue = Math.max(maxValue, x['max']);
        });
      });

      res[i][i]['linecell'].map((x, j) => {
        x['values'] = runsValues[j];
        x['valuesInPercent'] = runsPercentage[j];
        x['max'] = maxValue;
      });
    }

    return res.map((d: ICellData[], index) =>
      this.createCell(AppConstants.CELL_FP, d, index, singleEpochIndex)
    );
  }
}

export class FNChartColumn extends ChartColumn {
  constructor(
    public $node: d3.Selection<any>,
    public readonly orientation: EChartOrientation
  ) {
    super($node, orientation);
  }

  protected createPanelCells(
    data: ICellData[],
    singleEpochIndex: number[]
  ): PanelCell[] {
    data = data.slice(0);
    const arraysTmp = [],
      size = AppConstants.CONF_MATRIX_SIZE;
    while (data.length > 0) {
      arraysTmp.push(data.splice(0, size));
    }

    const arrays = JSON.parse(JSON.stringify(arraysTmp));

    for (let i = 0; i < AppConstants.CONF_MATRIX_SIZE; i++) {
      // Get number of runs
      let numRuns = 0;
      arrays[i]
        .map((d) => d['linecell'].length)
        .map((d) => {
          numRuns = Math.max(d, numRuns);
        });

      const runsValues = Array.from(
        new Array(numRuns),
        (x, i) => i
      ).map((d) => []);
      const runsPercentage = Array.from(
        new Array(numRuns),
        (x, i) => i
      ).map((d) => []);

      let maxValue = 0;

      arrays[i].map((d) => {
        d['linecell'].map((x, j) => {
          if (runsValues[j].length === 0) {
            runsValues[j] = x['values'];
            runsPercentage[j] = x['valuesInPercent'];
          } else {
            if (x['values'].length !== 0) {
              runsValues[j] = runsValues[j].map(
                (val, valIndex) => val + x['values'][valIndex]
              );
              runsPercentage[j] = runsPercentage[j].map(
                (val, valIndex) => val + x['valuesInPercent'][valIndex]
              );
            }
          }
          x['values'] = [];
          x['valuesInPercent'] = [];
          maxValue = Math.max(maxValue, x['max']);
        });
      });

      arrays[i][i]['linecell'].map((x, j) => {
        x['values'] = runsValues[j];
        x['valuesInPercent'] = runsPercentage[j];
        x['max'] = maxValue;
      });
    }

    return arrays.map((d: ICellData[], index) =>
      this.createCell(AppConstants.CELL_FN, d, index, singleEpochIndex)
    );
  }
}
