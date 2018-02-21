export abstract class ADetailView {
  protected $node: d3.Selection<any>;
  constructor(public name: string, protected $parent: d3.Selection<any>) {
    this.$node = $parent.append('div').classed('viewpanel-content', true);
  }
  abstract render();

  shouldDisplay(show = true) {
    if(show) {
      this.$node.style('visibility', 'visible');
    } else {
      this.$node.style('visibility', 'hidden');
    }
  }
}
