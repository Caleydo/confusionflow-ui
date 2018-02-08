/**
 * Created by Martin on 01.02.2018.
 */
import {IClassEvolution} from './DataStructures';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {createTooltip} from './utils';

export class LineChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>) {
    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    const $svg = $parent
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('linechart', true);

    this.$node = $svg.append('g');
  }

  render(data: IClassEvolution, maxVal: number, minVal: number) {
    const $g = this.$node;

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    x.domain([0, data.values.length - 1]);
    y.domain([minVal, maxVal]);

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    $g.append('path').attr('d', line(data.values));
  }
}

export class MultilineChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>, private lineCount: number) {
    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    const $svg = $parent
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('multilinechart', true);

    this.$node = $svg.append('g');
  }

  render(data: IClassEvolution[], maxVal: number, minVal: number) {
    const $g = this.$node;

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    const z = d3.scale.category10();

    x.domain([0, this.lineCount]);
    y.domain([minVal, maxVal]);
    z.domain(data.map(function(c) { return c.label; }));

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const $epochLine = $g.selectAll('path.line')
    .data(data)
    .enter().append('path')
      .attr('class', 'line')
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.label));

    createTooltip(this.$node, $epochLine, (d) => d.label);
  }
}
