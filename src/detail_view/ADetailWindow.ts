export abstract class ADetailWindow {

  protected $node: d3.Selection<any>;

  constructor(public id: string, public name: string, protected $parent: d3.Selection<any>) {
    this.$node = $parent.append('div').classed('viewpanel-content', true).attr('id', this.id);
  }

  abstract render();
  abstract clear();

  shouldDisplay(show = true) {
    if(show) {
      this.$node.style('display', 'block');
    } else {
      this.$node.style('display', 'none');
    }
  }
}
