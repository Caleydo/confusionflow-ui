/**
 * Created by Martin on 29.01.2018.
 */

import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, min} from './DataStructures';
import {BarChart} from './BarChart';
import {LineChart, MultilineChart} from './LineChart';
import * as d3 from 'd3';
import {adaptTextColorToBgColor} from './utils';
import {AppConstants} from './AppConstants';

export interface ICellRenderer {
  renderCells($parent: d3.Selection<any>);
}

export class SingleLineChartCellRenderer implements ICellRenderer {
  maxVal: number;
  minVal: number;

  constructor(private data: Matrix<IClassEvolution>, private filterZeroLines = true) {
    this.maxVal = max(data, (d) => Math.max(...d.values));
    this.minVal = min(data, (d) => Math.min(...d.values));
  }

  renderCells($parent: d3.Selection<any>) {
    const r = this.data.to1DArray();
    const $cells = $parent.selectAll('div').data(r, (datum) => this.createKey(datum));

    $cells.exit().remove();

    $cells.enter().append('div')
      .classed('cell', true);

    const that = this;
    $cells.each(function(d, i) {
       // if we want to filter zero lines and the the line has just 0 values => continue
      if(that.filterZeroLines && !d.values.find((val) => val !== 0)) {
        return;
      }
      new LineChart(d3.select(this)).render(d, that.maxVal, that.minVal);
    });
  }

  private createKey(cur: IClassEvolution) {
    return cur.values + cur.label;
  }
}

export class MultilineChartCellRenderer implements ICellRenderer {
  maxVal: number;
  minVal: number;

  constructor(private data: SquareMatrix<IClassEvolution>) {
    this.maxVal = max(data, (d) => Math.max(...d.values));
    this.minVal = min(data, (d) => Math.min(...d.values));
  }

  renderCells($parent: d3.Selection<any>) {
    $parent.selectAll('div').remove();
    const $cells = $parent.selectAll('div').data(this.data.values);
    $cells.enter().append('div')
      .classed('cell', true);

    const that = this;
    $cells.each(function(d, i) {
      const lineCount = d[0].values.length - 1;
      new MultilineChart(d3.select(this), lineCount).render(d, that.maxVal, that.minVal);
    });
  }
}

export class BarChartCellRenderer implements ICellRenderer {

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
        new BarChart(d3.select(this), {top:0, bottom:0, left:0, right:0}).render(d);
      });
  }

  private createKey(d: IClassAffiliation[]) {
    return d.reduce((acc, cur) => {
      acc += cur.count + cur.label;
      return acc;
    }, '');
  }
}

export class HeatCellRenderer implements ICellRenderer {
  private readonly heatmapColorScale: any;

  constructor(private data: number[]) {
    this.heatmapColorScale = d3.scale.linear()
      .domain([0, Math.max(...data)])
      .range(<any>AppConstants.BW_COLOR_SCALE)
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
      .style('background-color', (datum: any) => this.heatmapColorScale(datum))
      .style('color', (datum: number) => adaptTextColorToBgColor(this.heatmapColorScale(datum).toString()))
      .text((d) => String(d));

    $cells
      .exit()
      .remove();
  }
}
