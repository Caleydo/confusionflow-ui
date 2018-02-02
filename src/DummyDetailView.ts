import * as d3 from 'd3';
import {IAppView} from './app';
import {ConfusionMatrix} from './ConfusionMatrix';
import {AppConstants} from './AppConstants';
import * as events from 'phovea_core/src/event';
import {Language} from './language';


export class DummyDetailView implements IAppView {

  private readonly $node: d3.Selection<any>;

  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('detail-view', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DummyDetailView>}
   */
  init() {
    this.attachListeners();
    this.setupLayout();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_CELL_SELECTED, (evt, predicted, groundTruth, labels) => {
      this.$node.select('.title')
        .html(`<strong>${labels[groundTruth][1]}</strong> ${Language.PREDICTED_AS} <strong>${labels[predicted][1]}</strong>`);
    });
  }

  private setupLayout() {
    this.$node.html(`<p class="title"></p>`);
  }


}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent:Element, options:any) {
  return new DummyDetailView(parent);
}
