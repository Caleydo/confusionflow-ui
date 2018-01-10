/**
 * Created by Martin on 04.01.2018.
 */

import {IMalevoDataset, MalevoDatasetCollection} from './malevo_dataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';

export default class Timeline {
  private readonly $node:d3.Selection<any>;

  constructor(parent: d3.Selection<any>) {
    this.$node = parent.append('div').classed('bar_chart', true);
    this.attachListener();
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items:MalevoDatasetCollection) => {
     this.updateItems(items);
    });
  }

  private getJSONEpochMetadata(data: MalevoDatasetCollection) {
    return ajax.getAPIJSON(`/malevo/epoch/${data}`);
  }

  private loadData(malevoData: MalevoDatasetCollection) {
    //this.getJSONEpochMetadata()
  }

  updateItems(malevoData: MalevoDatasetCollection) {
  //malevoData.forEach((x) => new Ratiobar(this.$node, x));

  const data = [[{type: 'tp', value: 4}, {type: 'fp', value: 6}], [{type: 'tp', value: 3}, {type: 'fp', value: 7}]];

  //this.loadData(malevoData);

  const $bars = this.$node.selectAll('div.bars')
    .data(data);

  $bars.enter().append('div')
    .classed('bars', true)
    .classed('loading', true)
    .style('width', 16 + 'px')
    .style('height', 100 + 'px');

  $bars.style('left', (d, i) => i * 10 + 'px');

  $bars.exit().remove();

  const $divs = $bars.selectAll('div')
    .data((x) => x);
  $divs.enter().append('div');

  const y = d3.scale.linear()
    .domain([0, 7]).range([0, 100]);

  $divs
    .attr('class', (d) => `bar ${d.type}-color`)
    .style('height', (d) => y(d.value) + 'px')
    .style('width', 12 + 'px');

  $divs.exit().remove();



  $bars.classed('loading', false);
  }
}
