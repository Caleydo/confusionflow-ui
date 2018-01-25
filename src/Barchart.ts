import * as d3 from 'd3';

export class Barchart {
  private readonly $node: d3.Selection<any>;
  private readonly margin = {top: 5, bottom: 0};
  private readonly width: number;
  private readonly height: number;
  private readonly BAR_WIDTH = 2;

  constructor($parent: d3.Selection<any>) {
    const $svg = $parent
      .append('svg')
      .classed('barchart', true)
      .attr('width', '100%')
      .attr('height', '100%');

    this.$node = $svg.append('g')
      .attr('transform', 'translate(' + '0' + ',' + this.margin.top + ')');

    this.width = (<any>$svg[0][0]).clientWidth;
    this.height = (<any>$svg[0][0]).clientHeight - this.margin.top - this.margin.bottom;
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
