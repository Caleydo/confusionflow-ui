import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import {DetailChartTab} from './DetailChartTab';
import {DetailImageWindow} from './DetailImageTab';
import {SoftmaxStampTab} from './SoftmaxStampTab';
import {ADetailViewTab} from './ADetailViewTab';
import {Language} from '../language';


export class DetailView implements IAppView {

  private readonly $selectionPanel: d3.Selection<any>;
  private readonly $viewbody: d3.Selection<any>;
  private panelCollection: Map<string, ADetailViewTab> = new Map();
  private selectedDetailView: ADetailViewTab = null;

  constructor(parent:Element) {
    this.$selectionPanel = d3.select(parent)
      .append('div')
      .classed('selection-panel-wrapper', true);
    this.$viewbody = d3.select(parent)
      .append('div')
      .classed('view-body', true);

    this.panelCollection.set(AppConstants.CHART_VIEW, new DetailChartTab(AppConstants.CHART_VIEW, Language.CHART_VIEW, this.$viewbody));
    this.panelCollection.set(AppConstants.IMAGE_VIEW,  new DetailImageWindow(AppConstants.IMAGE_VIEW, Language.IMAGE_VIEW, this.$viewbody));
    this.panelCollection.set(AppConstants.SOFTMAX_STAMP_VIEW,  new SoftmaxStampTab(AppConstants.SOFTMAX_STAMP_VIEW, Language.SOFTMAX_STAMP_VIEW ,this.$viewbody));
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
    const e = AppConstants.SINGLE_LINE_PRECISION + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.MULTI_LINE_CHART_CELL_FP + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.MULTI_LINE_CHART_CELL_FN + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.SINGLE_LINE_MATRIX_CELL + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.COMBINED_MATRIX_CELL + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.COMBINED_CHART_CELL_FP + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.COMBINED_CHART_CELL_FN + events.EventHandler.MULTI_EVENT_SEPARATOR +
      AppConstants.COMBINED_CHART_CELL_PRECISION;

    events.on(e, () => {
      if(this.selectedDetailView !== null && this.selectedDetailView.id === AppConstants.CHART_VIEW) {
        this.selectedDetailView.render();
      }
    });

	events.on(AppConstants.CLEAR_DETAIL_VIEW, () => {
		this.selectedDetailView.clear();
	});
  }

  private createSelectionPanel() {

    const $div = this.$selectionPanel.selectAll('div').data(Array.from(this.panelCollection.values()));

    const that = this;
    $div.enter().append('a')
      .classed('selection-panel', true)
      .attr('href', (d) => '#' + d.id)
      .text((x) => x.name)
      .on('click', function (content) {
        (<MouseEvent>d3.event).preventDefault();
        $div.classed('selected', false);
        $div.each((d) => d.shouldDisplay(false));
        that.selectView(content, d3.select(this));
      })
      .each((content) => content.shouldDisplay(false));

    $div.exit().remove();

    // set a default view
    const defaultView = AppConstants.CHART_VIEW;
    this.selectView(this.panelCollection.get(defaultView), $div.filter((x) => x.id === defaultView));
  }

  private selectView(tab: ADetailViewTab, $node: d3.Selection<any>) {
    $node.classed('selected', true);
    tab.shouldDisplay(true);
    this.selectedDetailView = tab;
    this.selectedDetailView.render();
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
