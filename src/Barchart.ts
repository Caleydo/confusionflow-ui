import * as d3 from 'd3';

export class Barchart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;
  private readonly BAR_WIDTH = 3;

  constructor($parent: d3.Selection<any>, margin: {top, bottom, left, right}) {
    this.width = (<any>$parent[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>$parent[0][0]).clientHeight - margin.top - margin.bottom;

    const $svg = $parent
      .append('svg')
      .classed('barchart', true)
      .attr('width', this.width + 'px')
      .attr('height', this.height + 'px');

    this.$node = $svg.append('g')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }


  render(bins: number[]) {
    const $g = this.$node;

    const x = d3.scale.linear().domain([0, 9]).rangeRound([0, this.width-this.BAR_WIDTH]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    y.domain([0, d3.max(bins, (d) => { return d; })]);

    const $bars = $g.selectAll('.bar')
    .data(bins);

    $bars.enter().append('rect')
      .attr('class', 'bar');

    const barColors = d3.scale.category10();

    $bars.attr('x', (d, i) => { return x(i); })
    .attr('y', (d) => { return y(d); })
    .attr('width', this.BAR_WIDTH+ 'px')
    .attr('height', (d) => { return this.height - y(d); })
    .attr('fill', (d, i) => barColors(String(i)));

    $bars.exit().remove();
  }
}
