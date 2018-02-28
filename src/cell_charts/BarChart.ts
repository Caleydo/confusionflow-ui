import * as d3 from 'd3';
import {IClassAffiliation} from '../DataStructures';

export class BarChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>, margin: {top, bottom, left, right}) {
    this.width = (<any>$parent[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>$parent[0][0]).clientHeight - margin.top - margin.bottom;

    const $svg = $parent
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('barchart', true);

    this.$node = $svg.append('g');
  }


  render(bins: IClassAffiliation[], minValue: number, maxValue: number) {
    const $g = this.$node;

    const x = d3.scale.ordinal().domain(bins.map((x) => x.label)).rangeRoundBands([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    y.domain([minValue, maxValue]);

    const $bars = $g.selectAll('.bar')
    .data(bins);

    $bars.enter().append('rect')
      .attr('class', 'bar')
      .append('title')
		    .text((d) => d.label + ': ' + d.count);

    const barColors = d3.scale.category10();

    $bars.attr('x', (d, i) => { return x(d.label); })
    .attr('y', (d) => { return y(d.count); })
    .attr('width', + x.rangeBand())
    .attr('height', (d) => { return this.height - y(d.count); })
    .attr('fill', (d, i) => barColors(String(i)));
    $bars.exit().remove();
  }
}
