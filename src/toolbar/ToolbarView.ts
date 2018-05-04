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
    events.on(AppConstants.EVENT_REDRAW, () => {
      this.setStateToHeatmap();
    });
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
    const $div = this.$node.append('div')
      .classed('toolbar-switch-cell-vis', true)
      .classed('btn-group-vertical', true)
      .attr('role', 'group')
      .html(`
        <button class="btn btn-default line-chart" title="Switch to line chart">
          <i class="fa fa-line-chart"></i>
          <span class="sr-only">&nbsp; Line Chart</span>
        </button>
        <button class="btn btn-default heatmap active" title="Switch to heatmap">
          <i class="fa fa-barcode"></i>
          <span class="sr-only">&nbsp; Heatmap</span>
        </button>
      `);

    $div.select('button.line-chart').on('click', () => {
      if (DataStoreApplicationProperties.switchCellRenderer === true) {
        return false;
      }

      DataStoreApplicationProperties.switchCellRenderer = true;
      $div.selectAll('.active').classed('active', false);
      $div.select('button.line-chart').classed('active', true);
      this.$node.select('.toolbar-transpose-cell > button').attr('disabled', 'disabled');
    });

    $div.select('button.heatmap').on('click', () => {
      if (DataStoreApplicationProperties.switchCellRenderer === false) {
        return false;
      }

      this.setStateToHeatmap();
    });
  }

  private setStateToHeatmap() {
    DataStoreApplicationProperties.switchCellRenderer = false;
    this.$node.select('div').selectAll('.active').classed('active', false);
    this.$node.select('div').select('button.heatmap').classed('active', true);
    this.$node.select('.toolbar-transpose-cell > button').attr('disabled', null);
  }

  private createTransposeCellsDiv() {
    const $div = this.$node.append('div')
      .classed('toolbar-transpose-cell', true)
      .html(`
        <button class="btn btn-default line-chart" title="Change direction of epochs">
          <i class="fa fa-long-arrow-right"></i>
          <span>epochs</span>
        </button>
      `)
      .select('button')
      .on('click', () => {
        DataStoreApplicationProperties.toggleTransposeCellRenderer();
        $div.select('i.fa')
          .classed('fa-long-arrow-right', DataStoreApplicationProperties.transposeCellRenderer === false)
          .classed('fa-long-arrow-down', DataStoreApplicationProperties.transposeCellRenderer === true);
        this.$node.select('.toolbar-switch-cell-vis > button.heatmap i.fa')
          .classed('fa-rotate-90', DataStoreApplicationProperties.transposeCellRenderer);
      });
  }

  private addYScaleSlider() {
    const $div = this.$node.append('div').classed('y-scale-slider', true);
    $div.html(`<input type="range" min="0" max="0.9" step="0.1" value="${1 - DataStoreApplicationProperties.weightFactor}" orient="vertical">`);
    $div.select('input')
      .on('input', function () {
        DataStoreApplicationProperties.weightFactor = this.value;
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
