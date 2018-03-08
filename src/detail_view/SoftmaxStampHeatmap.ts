/**
 * Created by Holger Stitz on 30.08.2016.
 */

import * as vis from 'phovea_core/src/vis';
import * as events from 'phovea_core/src/event';
import * as d3 from 'd3';
import {AppConstants} from '../AppConstants';
import {IAnyMatrix} from 'phovea_core/src/matrix';
import {INumberValueTypeDesc} from 'phovea_core/src/datatype';
import {mixin} from 'phovea_core/src';

/**
 * Shows a simple heat map for a given data set.
 */
export class SoftmaxStampHeatmap {

  private $node:d3.Selection<any>;

  private matrix:IAnyMatrix;
  private scaleFactor: {x: number, y: number};

  private heatMapOptions = {
      initialScale: AppConstants.SOFTMAX_HEATMAP_CELL_SIZE,
      color: ['white', 'black'],
      domain: [0, 1]
    };

  constructor($parent: d3.Selection<any>) {
    this.$node = $parent
      .append('div')
      .classed('heatmap', true);
  }

  /**
   * Run update only if scaleFactor and matrix data is set
   */
  private checkAndUpdate() {
    if(this.matrix && this.scaleFactor) {
      this.update(this.matrix, this.scaleFactor);
    }
  }

  /**
   * Loads a Caleydo heat map visualization plugin and hands the given data set over for visualizing it
   * @param dataset
   * @param scaleFactor
   * @returns {Promise<HeatMap>}
   */
  update(dataset: IAnyMatrix, scaleFactor: {x: number, y: number}) {

    if(dataset.desc.type !== 'matrix') {
      console.warn(`Data set is not of type matrix and cannot be visualized from heat map plugin`);
      return;

    }
    //console.log('DATASET', dataset);
    const plugins = vis.list(dataset).filter((d) => /.*heatmap.*/.test(d.id));


    if (plugins.length === 0) {
      console.warn(`Heat map visualization plugin not found`);
      return;
    }

    const showLabels = chooseLabel(dataset.nrow, dataset.ncol);
    const scale = [this.heatMapOptions.initialScale * scaleFactor.x, this.heatMapOptions.initialScale * scaleFactor.y];

    switch(showLabels) {
      case 'CELL':
        d3.select(this.$node.node().parentElement).classed('heatmap-has-column-labels', true);
        this.$node.classed('heatmap-row-labels', true).classed('heatmap-column-labels', true);
        scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
        break;
      case 'ROW':
        this.$node.classed('heatmap-row-labels', true);
        scale[0] -= 0.65; // decrease width of heat map to show row labels TODO make it flexible based on the longest label
        break;
      case 'COLUMN':
        d3.select(this.$node.node().parentElement).classed('column-labels', true);
        this.$node.classed('heatmap-column-labels', true);
        break;
    }

    const maxRangeValue = Math.max(...(<INumberValueTypeDesc>dataset.valuetype).range.map((d) => Math.abs(d)));

    const options = mixin({}, this.heatMapOptions, {
      scale,
      domain: [0, maxRangeValue]
    });

    this.$node.classed('loading', true);

    return Promise.all([plugins[0].load()])
      .then((args) => {
        this.clearContent();

       // console.log('args from plugins', args);
        const plugin = args[0];
       // console.log('const plugin- args', plugin);
        plugin.factory(
          dataset,
          this.$node.node(),
          options
        );
        return this;
      })
      .then((instance) => {
        this.$node.classed('loading', false);
        return instance;
      });
  }

  /**
   * Clear the content and reset this view
   */
  private clearContent() {
    this.$node.html('');
  }

}

/**
 * Decided based on the number of rows and columns if and if yes, which labels should be shown for the heatmap
 * @param nrow
 * @param ncol
 * @returns {string}
 */
function chooseLabel(nrow: number, ncol: number):string {
  if (nrow < AppConstants.SOFTMAX_MAXIMAL_HEATMAP_LABEL_SIZE && ncol < AppConstants.SOFTMAX_MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'CELL';
  }
  if (nrow < AppConstants.SOFTMAX_MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'ROW';
  }
  if (ncol < AppConstants.SOFTMAX_MAXIMAL_HEATMAP_LABEL_SIZE) {
    return 'COLUMN';
  }
  return 'NONE';
}
