/**
 * Created by Martin on 04.01.2018.
 */

import {IMalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import TimelineRangeSelector from './timeline_range_selector';

export default class Timeline {
  private readonly $node:d3.Selection<any>;
  private readonly OFFSET = 10;

  constructor(parent: d3.Selection<any>) {
    this.$node = parent.append('div').classed('timeline', true);
    this.attachListener();
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items:IMalevoDataset) => {
     this.updateItems(items);
    });
  }

  private getJSONEpochMetadata(data: INumericalMatrix) : Promise<any> {
    return ajax.getAPIJSON(`/malevo_api/epoch/${data.desc.id}/ratio_bar`);
  }

  private loadConfusionData(malevoData: INumericalMatrix) : Promise<any> {
    return malevoData.data()
      .then((x) => {
        console.log(x);
      });
  }

  createLineSeparator($node: d3.Selection<any>) {
    const count = 4 * 20 + 3 * this.OFFSET;
    $node.append('div')
      .classed('line', true)
      .style('width', count + `px`);
  }

  updateItems(malevoData: IMalevoDataset) {
    const that = this;
    new TimelineRangeSelector(this.$node);
    this.createLineSeparator(this.$node);
    const $bars = this.$node.selectAll('div.epoch-circle')
      .data(malevoData.epochInfos);
    $bars.enter().append('div')
      .classed('epoch-circle', true)
      .classed('loading', true)
      .each(function(epochInfo: IMalevoEpochInfo, i: number) {
        that.getJSONEpochMetadata(epochInfo.confusionInfo)
          .then((json) => {
            const $bar = d3.select(this);
            $bar.classed('loading', false);
            return epochInfo;
          })
          .then((epochInfo) => {
            // get heatmap
            const $bar = d3.select(this);
            $bar.on('click', function(this: HTMLElement, d: IMalevoEpochInfo) {
              const state = d3.select(this).classed('selected');
              d3.select(this).classed('selected', !state);
              // load heatmap
              //events.fire(AppConstants.EVENT_EPOCH_SELECTED, json);
            });
          });
      });
    $bars.style('left', (d, i) => i * that.OFFSET + 'px');
    $bars.exit().remove();
  }
}
