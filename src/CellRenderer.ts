/**
 * Created by Martin on 29.01.2018.
 */

import {IClassAffiliation, IClassEvolution, SquareMatrix, max, min} from './DataStructures';
import {Barchart} from './Barchart';
import {Linechart} from './Linechart';
import * as d3 from 'd3';

export interface ICellRenderer {
  renderCells($parent: d3.Selection<any>);
}

export class LineChartCellRenderer implements ICellRenderer {
  maxVal: number;
  minVal: number;

  constructor(private data: SquareMatrix<IClassEvolution>) {
    this.maxVal = max(data, (d) => Math.max(...d.values));
    this.minVal = min(data, (d) => Math.min(...d.values));
  }

  renderCells($parent: d3.Selection<any>) {
    const r = this.data.to1DArray();
    //todo ask holger if this is the best way
    $parent.selectAll('div').remove();
    const $cells = $parent.selectAll('div').data(r);

    $cells.enter().append('div')
      .classed('cell', true);

    const that = this;
    $cells.each(function(d, i) {
      new Linechart(d3.select(this)).render(d, that.maxVal, that.minVal);
    });
  }

  private createKey(d: IClassEvolution | number , index: number): string {
    if(typeof d === 'number') {
      return String(d);
    }
    const res = d.values.reduce((acc, cur) => {
      acc += String(cur);
      return acc;
    }, '');
    console.log('Index: ' + index + ' Val ' + res);
    return res;
  }
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

    $enterSelection.each(function(d) {
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
      }));

    $cells
      .exit()
      .remove();
  }
}
