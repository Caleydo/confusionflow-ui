import * as d3 from 'd3';
import {IAppView} from '../app';
import {ConfusionMatrix} from '../ConfusionMatrix';
import {AppConstants} from '../AppConstants';
import * as events from 'phovea_core/src/event';
import * as plugins from 'phovea_core/src/plugin';
import {DataStoreApplicationProperties} from '../DataStore';

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
    this.createSwitchCellsVisDiv();
    this.createTransposeCellsDiv();
    this.addYScaleSlider();
    return Promise.resolve(this);
  }

  private createSwitchCellsVisDiv() {
    this.$node.append('div')
      .classed('toolbar-switch-cell-vis', true)
      .html(`
        <input type="checkbox" id="switch-cell-renderer">
      `)
      .select('input')
      .on('change', () => {
        DataStoreApplicationProperties.toggleSwitchCellRenderer();
      });
  }

  private createTransposeCellsDiv() {
    this.$node.append('div')
      .classed('toolbar-transpose-cell', true)
      .html(`
        <input type="checkbox" class="sr-only" id="transpose-cell-renderer">
        <label for="transpose-cell-renderer" title="Transpose matrix visualization">
          <span class="sr-only">Change direction of </span><span>epochs</span>
        </label>
      `).select('input')
      .on('change', () => {
        DataStoreApplicationProperties.toggleTransposeCellRenderer();
      });
  }

  private addYScaleSlider() {
    const $div = this.$node.append('div').classed('y-scale-slider', true);
    $div.html(`<input type="range" min="0" max="0.9" step="0.1" value="${1 - DataStoreApplicationProperties.weightFactor}" orient="vertical">`);
    $div.select('input')
      .on('input', function () {
        DataStoreApplicationProperties.updateWeightFactor(this.value);
      });
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
