/**
 * Created by Martin on 29.01.2018.
 */

import {IClassAffiliation, SquareMatrix} from './DataStructures';
import {Barchart} from './Barchart';
import * as d3 from 'd3';

export interface ICellRenderer {
  renderCells($parent: d3.Selection<any>);
}

export class BarchartCellRenderer implements ICellRenderer {
  constructor(private data: SquareMatrix<IClassAffiliation>) {
  }

  renderCells($parent: d3.Selection<any>) {
    const $cells = $parent
      .selectAll('div')
      .data(this.data.values, (d) => this.createKey(d));

    // has to be called before enter(), otherwise clientheight = 0
    $cells
      .exit()
      .remove();

    const $enterSelection = $cells
      .enter()
      .append('div')
      .classed('cell', true);

    $enterSelection.each(function(d, i) {
        new Barchart(d3.select(this), {top:0, bottom:0, left:0, right:0}).render(d);
      });
  }

  private createKey(d: IClassAffiliation[]) {
    const res = d.reduce((acc, cur) => {
      acc += cur.count + cur.label;
      return acc;
    }, '');
    return res;
  }
}

export class HeatCellRenderer implements ICellRenderer {
  private readonly heatmapColorScale: any;

  constructor(private data: number[]) {
    this.heatmapColorScale = d3.scale.linear().domain([0, Math.max(...data)])
      .range((<any>['white', 'gray']))
      .interpolate(<any>d3.interpolateHcl);
  }

  renderCells($parent: d3.Selection<any>) {
    const $cells = $parent
      .selectAll('div')
      .data(this.data);

    $cells
      .enter()
      .append('div')
      .classed('cell', true);

    $cells
      .style('background-color', ((datum: any) => {
          return this.heatmapColorScale(datum);
      }))
      .text((d) => String(d));

    $cells
      .exit()
      .remove();
  }
}
