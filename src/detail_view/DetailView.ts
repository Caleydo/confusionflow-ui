import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import {Language} from '../language';
import {DetailChartView} from './DetailChartView';
import {ADetailView} from './ADetailView';

export class DetailView implements IAppView {

  private readonly $selectionPanel: d3.Selection<any>;
  private readonly $viewbody: d3.Selection<any>;
  private panelCollection: ADetailView[] = [];

  constructor(parent:Element) {
    this.$selectionPanel = d3.select(parent)
      .append('div')
      .classed('selection-panel', true);
    this.$viewbody = d3.select(parent)
      .append('div')
      .classed('view-body', true);

    this.panelCollection.push(new DetailChartView(AppConstants.CHARTVIEW, this.$selectionPanel));
    this.panelCollection.push(new DetailChartView(AppConstants.CHARTVIEW, this.$selectionPanel));
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DetailView>}
   */
  init() {
    this.attachListeners();
    this.setupLayout();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_CELL_SELECTED, (evt, src, predicted, groundTruth, labels) => {
      this.$selectionPanel.select('.title')
        .html(`<strong>${labels[groundTruth][1]}</strong> ${Language.PREDICTED_AS} <strong>${labels[predicted][1]}</strong>`);
    });
  }

  private setupLayout() {

    const $div = this.$selectionPanel.selectAll('div').data(this.panelCollection);

    $div.enter().append('div')
      .classed('panel', true)
      .text((x) => x.name)
      .on('click', (x) => {
        console.log(this);
        x.show();
      });

    $div.exit().remove();
  }


}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent:Element, options:any) {
  return new DetailView(parent);
}
