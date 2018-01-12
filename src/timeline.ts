/**
 * Created by Martin on 04.01.2018.
 */

import {IMalevoDataset, IMalevoDatasetCollection} from './malevo_dataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as data from 'phovea_core/src/data';

export default class Timeline {
  private readonly $node:d3.Selection<any>;

  constructor(parent: d3.Selection<any>) {
    this.$node = parent.append('div').classed('bar_chart', true);
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

  updateItems(malevoData: IMalevoDataset) {
    const that = this;
    const $bars = this.$node.selectAll('div.bars')
      .data(malevoData.epochInfos);
    $bars.enter().append('div')
      .classed('bars', true)
      .classed('loading', true)
      .style('width', 16 + 'px')
      .style('height', 100 + 'px')
      .each(function(epochInfo, i) {
        that.getJSONEpochMetadata(epochInfo.epochInfo)
          .then((json) => {
            const $bar = d3.select(this);
            that.drawBar($bar, json);
            $bar.classed('loading', false);
            return epochInfo;
          })
          .then((epochInfo) => {
            // get heatmap
            const $bar = d3.select(this);
            $bar.on('click', (d) => {
              that.loadConfusionData(epochInfo.confusionInfo)
                .then((data) => {
                  console.log(data);
                });
              //events.fire(AppConstants.EVENT_EPOCH_SELECTED, json);
            });
          });
      });
    $bars.style('left', (d, i) => i * 10 + 'px');
    $bars.exit().remove();
  }

  drawBar($bar, json) {
    const $divs = $bar.selectAll('div')
      .data(json.accuracy);
    const y = d3.scale.linear()
      .domain([0, 7]).range([0, 100]);
    $divs.enter().append('div')
      .attr('class', (d) => `bar ${d.type}-color`)
      .style('height', (d) => y(d.value) + 'px')
      .style('width', 12 + 'px');
    $divs.exit().remove();
  }
}
