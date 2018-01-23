export class Barchart {
  private readonly $node: d3.Selection<any>;

  constructor($parent: d3.Selection<any>) {
    this.$node = $parent.append('div').classed('barchart', true);

  }
}
