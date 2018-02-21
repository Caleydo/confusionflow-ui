import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import {DetailChartWindow} from './DetailChartWindow';
import {DetailImageWindow} from './DetailImageWindow';
import {ADetailWindow} from './ADetailWindow';


export class DetailView implements IAppView {

  private readonly $selectionPanel: d3.Selection<any>;
  private readonly $viewbody: d3.Selection<any>;
  private panelCollection: Map<string, ADetailWindow> = new Map();
  private selectedDetailView: ADetailWindow = null;

  constructor(parent:Element) {
    this.$selectionPanel = d3.select(parent)
      .append('div')
      .classed('selection-panel', true);
    this.$viewbody = d3.select(parent)
      .append('div')
      .classed('view-body', true);

    this.panelCollection.set(AppConstants.CHARTVIEW, new DetailChartWindow(AppConstants.CHARTVIEW, this.$viewbody));
    this.panelCollection.set(AppConstants.IMAGEVIEW,  new DetailImageWindow(AppConstants.IMAGEVIEW, this.$viewbody));
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
    events.on(AppConstants.COMBINED_EPOCH_CELL, () => {
      if(this.selectedDetailView !== null && this.selectedDetailView.name === AppConstants.CHARTVIEW) {
        this.selectedDetailView.render();
      }
    });
  }

  private createSelectionPanel() {

    const $div = this.$selectionPanel.selectAll('div').data(Array.from(this.panelCollection.values()));

    const that = this;
    $div.enter().append('div')
      .classed('panel', true)
      .text((x) => x.name)
      .on('click', function (content) {
        $div.classed('selected', false);
        $div.each((d) => d.shouldDisplay(false));
        that.selectView(content, d3.select(this));
      })
      .each((content) => content.shouldDisplay(false));

    $div.exit().remove();

    // set a default view
    const defaultView = AppConstants.CHARTVIEW;
    this.selectView(this.panelCollection.get(defaultView), $div.filter((x) => x.name === defaultView));
  }

  private selectView(content: ADetailWindow, $node: d3.Selection<any>) {
    $node.classed('selected', true);
    content.shouldDisplay(true);
    this.selectedDetailView = content;
    content.render();
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
