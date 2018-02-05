import * as d3 from 'd3';
import {IClassAffiliation} from './DataStructures';

export class BarChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>, margin: {top, bottom, left, right}) {
    this.width = (<any>$parent[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>$parent[0][0]).clientHeight - margin.top - margin.bottom;

    const $svg = $parent
      .append('svg')
      .classed('barchart', true);

    this.$node = $svg.append('g');
  }


  render(bins: IClassAffiliation[]) {
    const $g = this.$node;

    const x = d3.scale.ordinal().domain(bins.map((x) => x.label)).rangeRoundBands([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    y.domain([0, d3.max(bins, (d) => { return d.count; })]);

    const $bars = $g.selectAll('.bar')
    .data(bins);

    $bars.enter().append('rect')
      .attr('class', 'bar');

    const barColors = d3.scale.category10();
    const tooltip = this.createTooltip();

    $bars.attr('x', (d, i) => { return x(d.label); })
    .attr('y', (d) => { return y(d.count); })
    .attr('width', + x.rangeBand())
    .attr('height', (d) => { return this.height - y(d.count); })
    .attr('fill', (d, i) => barColors(String(i)))
    .on('mouseover', function() { tooltip.style('display', null); })
    .on('mouseout', function() { tooltip.style('display', 'none'); })
    .on('mousemove', function(d) {
      const xPosition = d3.mouse(this)[0] - 15;
      const yPosition = d3.mouse(this)[1] - 25;
      tooltip.attr('transform', 'translate(' + xPosition + ',' + yPosition + ')');
      tooltip.select('text').text(d.label + ': ' + d.count);
    });
    $bars.exit().remove();
  }

  createTooltip() {
    // Prep the tooltip bits, initial display is hidden
    const tooltip = this.$node.append('g')
      .classed('bar-tooltip', true)
      .style('display', 'none');

    tooltip.append('rect')
      .attr('width', 30)
      .attr('height', 20)
      .attr('fill', 'white');

    tooltip.append('text')
      .attr('x', 15)
      .attr('dy', '1.2em')
      .style('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');
    return tooltip;
  }
}
