/**
 * Created by Caleydo Team on 31.08.2016.
 */

import * as d3 from 'd3';
import DatasetSelector from './DatasetSelector';
import {HELLO_WORLD} from './language';
import ConfusionMatrix from './ConfusionMatrix';

/**
 * The main class for the App app
 */
export class App {

  private $node;

  constructor(parent:Element) {
    this.$node = d3.select(parent);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<App>}
   */
  async init() {
    return this.build();
  }

  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private async  build() {
    const ds = new DatasetSelector();
    const confusionMatrix = new ConfusionMatrix(this.$node);
    const epochs = await ds.load();
    confusionMatrix.render(epochs);

  }

  /**
   * Show or hide the application loading indicator
   * @param isBusy
   */
  setBusy(isBusy: boolean) {
    this.$node.select('.busy').classed('hidden', !isBusy);
  }

}

/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent:Element) {
  return new App(parent);
}
