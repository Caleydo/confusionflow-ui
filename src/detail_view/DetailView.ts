import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import * as plugins from 'phovea_core/src/plugin';
import {ADetailViewTab} from './ADetailViewTab';


export class DetailView implements IAppView {

  private readonly $selectionPanel: d3.Selection<any>;
  private readonly $viewbody: d3.Selection<any>;
  private selectedDetailView: ADetailViewTab = null;

  constructor(parent: Element) {
    this.$selectionPanel = d3.select(parent)
      .append('div')
      .classed('selection-panel-wrapper', true);
    this.$viewbody = d3.select(parent)
      .append('div')
      .classed('view-body', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DetailView>}
   */
  init() {
    this.attachListeners();
    return this.build();
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_CELL_SELECTED, () => {
      if (this.selectedDetailView !== null) {
        this.selectedDetailView.clear();
        this.selectedDetailView.render();
      }
    });

    events.on(AppConstants.CLEAR_DETAIL_VIEW, () => {
      this.$selectionPanel.selectAll('a').each((x: ADetailViewTab) => {
        x.clear();
      });
    });
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    // wrap view ids from package.json as plugin and load the necessary files
    const pluginPromises = plugins.list()
      .filter((d) => d.type === AppConstants.VIEW && d.isDetailWindow !== undefined)
      .sort((a, b) => d3.ascending(a.order, b.order))
      .map((d) => plugins.get(AppConstants.VIEW, d.id))
      .filter((d) => d !== undefined) // filter views that does not exists
      .map((d) => d.load());

    // when everything is loaded, then create and init the views
    const buildPromise = Promise.all(pluginPromises)
      .then((plugins) => {
        const initPromises = plugins.map((p, index): Promise<ADetailViewTab> => {
          const view = p.factory(
            this.$viewbody.node(), // parent node
            {} // options
          );
          return view.init();
        });

        // wait until all views are initialized, before going to next then
        return Promise.all(initPromises);
      })
      .then((viewInstances) => {
        this.selectedDetailView = viewInstances[0];
        this.createSelectionPanel(viewInstances);
        return this;
      });
    return buildPromise;
  }

  private createSelectionPanel(views: ADetailViewTab[]) {
    const $div = this.$selectionPanel.selectAll('div').data(views);

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
    this.selectView(views[0], $div.filter((x) => x.id === views[0].id));
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
export function create(parent: Element, options: any) {
  return new DetailView(parent);
}
