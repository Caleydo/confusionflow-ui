import * as d3 from "d3";

export abstract class ADetailWindow {

  public id: string = '';
  public name: string = '';

  protected $node: d3.Selection<any>;

  constructor(protected parent: Element) {
    this.$node = d3.select(parent).append('div').classed('viewpanel-content', true);
  }

  abstract init(): Promise<ADetailWindow>;
  abstract render(): void;
  abstract clear(): void;

  shouldDisplay(show = true) {
    this.$node.classed('hidden', !show);
  }
}
