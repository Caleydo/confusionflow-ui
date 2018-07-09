/**
 * Created by Martin on 09.07.2018.
 */
import {IAppView} from '../app';
import * as d3 from 'd3';

export default class ConfusionMeasuresView implements IAppView {
  private $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent).append('div').classed('metrics-table-content', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListener() {

  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMeasuresView(parent);
}
