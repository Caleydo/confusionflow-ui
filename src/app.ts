/**
 * Created by Martin on 22.12.2016.
 */

import * as plugins from 'phovea_core/src/plugin';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import Timeline from './Timeline';

/**
 * Interface for all Views
 */
export interface IAppView {

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<IAppView>}
   */
  init():Promise<IAppView>;

}

/**
 * Description for views that are loaded and initialized
 */
interface IAppViewDesc {
  /**
   * View id as defined in the package.json
   */
  view: string;

  /**
   * Parent node where to append this view
   * (either `selector` or `comparison`)
   */
  parent: string;

  /**
   * Options for this view
   */
  options: any;
}

/**
 * The main class for the app
 */
export class App implements IAppView {

  private $node;

  private views:IAppViewDesc[] = [
     {
      view: 'DataSetSelector',
      parent: 'selector',
      options: {}
    },
    {
      view: 'ConfusionMatrix',
      parent: 'comparison',
      options: {
        eventName: ''
      }
    },
    {
      view: 'Timeline',
      parent: 'selector-timepoint',
      options: {
        eventName: ''
      }
    }
  ];

  constructor(parent:Element) {
    this.$node = d3.select(parent);
    this.$node.append('div');

    this.$node.append('div').classed('selector-timepoint', true);
    this.$node.append('div').classed('comparison', true);

    /*const arr = [3, 5, 6];
    let $cells = this.$node.selectAll('div')
      .data(arr);

    console.log($cells.enter());
    console.log($cells.exit());
    $cells.exit().remove();

    const $enterSelection = $cells.enter().append('div');
    console.log($enterSelection);

    const arr2 = [1, 2, 4];
    $cells = this.$node.selectAll('div')
      .data(arr2, (d, i) => {
        console.log(d);
        return String(d);
      });
    console.log($cells.enter());
    console.log($cells.exit());*/

  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  init() {
    this.attachListener();
    return this.build();
  }

  private attachListener() {
    window.addEventListener('resize', () => {
      events.fire(AppConstants.EVENT_RESIZE);
    });
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private build() {
    // wrap view ids from package.json as plugin and load the necessary files
    const pluginPromises = this.views
      .map((d) => plugins.get(AppConstants.VIEW, d.view))
      .filter((d) => d !== undefined) // filter views that does not exists
      .map((d) => d.load());

    // when everything is loaded, then create and init the views
    const buildPromise = Promise.all(pluginPromises)
      .then((plugins) => {
        this.$node.select('h3').remove(); // remove loading text from index.html template

        const initPromises = plugins.map((p, index) => {
          const view = p.factory(
            this.$node.select(`.${this.views[index].parent}`).node(), // parent node
            this.views[index].options || {} // options
          );
          return view.init();
        });

        // wait until all views are initialized, before going to next then
        return Promise.all(initPromises);
      })
      .then((viewInstances) => {
        // loading and initialization has finished -> hide loading indicator
        return this;
      });
    return buildPromise;
  }


}

/**
 * Factory method to create a new Malevo instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}
