import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import {DetailChartView} from './DetailChartView';
import {ADetailView} from './ADetailView';

export class DetailView implements IAppView {

  private readonly $selectionPanel: d3.Selection<any>;
  private readonly $viewbody: d3.Selection<any>;
  private panelCollection: Map<string, ADetailView> = new Map();
  private selectedDetailView: ADetailView;

  constructor(parent:Element) {
    this.$selectionPanel = d3.select(parent)
      .append('div')
      .classed('selection-panel', true);
    this.$viewbody = d3.select(parent)
      .append('div')
      .classed('view-body', true);

    this.panelCollection.set(AppConstants.CHARTVIEW, new DetailChartView(AppConstants.CHARTVIEW, this.$viewbody));
    this.panelCollection.set(AppConstants.TESTVIEW,  new DetailChartView(AppConstants.TESTVIEW, this.$viewbody));
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DetailView>}
   */
  init() {
    this.attachListeners();
    this.createSelectionPanel();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.MULTI_EPOCH_CELL, () => {
      this.selectedDetailView[AppConstants.CHARTVIEW].render();
    });
  }

  private createSelectionPanel() {

    const $div = this.$selectionPanel.selectAll('div').data(Array.from(this.panelCollection.values()));

    $div.enter().append('div')
      .classed('panel', true)
      .text((x) => x.name)
      .on('click', (x) => {
        $div.each((d) => d.shouldDisplay(false));
        x.shouldDisplay(true);
        this.selectedDetailView = x;
        x.render();
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
