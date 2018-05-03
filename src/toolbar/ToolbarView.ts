import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import * as plugins from 'phovea_core/src/plugin';

export class ToolbarView implements IAppView {

  private readonly $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('toolbar', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ToolbarView>}
   */
  init() {
    this.attachListeners();
    return this.build();
  }

  private attachListeners() {
    //
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<ToolbarView>}
   */
  private build(): Promise<ToolbarView> {
    return Promise.resolve(this);
  }

}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ToolbarView}
 */
export function create(parent: Element, options: any) {
  return new ToolbarView(parent);
}
