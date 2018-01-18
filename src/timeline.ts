/**
 * Created by Martin on 04.01.2018.
 */

import {IMalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import * as ajax from 'phovea_core/src/ajax';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IDragSelection} from './range_selector';
import RangeSelector from './range_selector';

export default class Timeline implements IDragSelection {
  private readonly $node:d3.Selection<any>;
  private $circles:d3.Selection<any>;
  private $rubberband: d3.Selection<any>;

  constructor(parent: d3.Selection<any>) {
    this.$node = parent.append('div').attr('id', 'timeline');
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

  private createRubberband() {
    this.$rubberband = this.$node.append('div').classed('selection', true);
  }

  updateItems(malevoData: IMalevoDataset) {
    const that = this;
    this.createRubberband();
    const $circles = this.$node.selectAll('div.epochs')
      .data(malevoData.epochInfos);

    $circles.enter().append('div')
      .classed('epochs', true)
      .classed('loading', true)
      .each(function(epochInfo: IMalevoEpochInfo, i: number) {
        that.getJSONEpochMetadata(epochInfo.confusionInfo)
          .then((json) => {
            const $epochDiv = d3.select(this);
            $epochDiv.classed('loading', false);
            $epochDiv.html(`<div class="point"></div>
                            <div class="label">${epochInfo.name}</div>`);
            return epochInfo;
          })
          .then((epochInfo) => {
            // get heatmap
            const $bar = d3.select(this);
            /*$bar.on('click', function(this: HTMLElement, d: IMalevoEpochInfo) {
              const state = d3.select(this).classed('selected');
              d3.select(this).classed('selected', !state);
              // load heatmap
              //events.fire(AppConstants.EVENT_EPOCH_SELECTED, json);
            });*/
          });
      });
    $circles.exit().remove();
    this.$circles = $circles;
    new RangeSelector(this.$node, this.$node.selectAll('div.epochs'), [this]);
  }

  dragEnd(sel: d3.Selection<any>) {
    console.assert(sel.length === 1);
    if(sel[0].length > 1) {
      this.$circles.classed('range-selected', false);
      // call listeners here
      // call listeners here
      this.snapBand(sel);
      sel.classed('range-selected', true);
    } else {
      this.$circles.classed('single-selected', false);
      sel.classed('single-selected', true);
    }
    //this.$circles.style('border-color', 'black');
    sel.style('border-color', 'red');
    //events.fire(AppConstants.EVENT_EPOCH_SELECTED, sel);
  }

  dragStart() {
    this.$rubberband.style('visibility', 'visible');

  }

  dragging(start: [number, number], end: [number, number]) {
    console.assert(start[0] <= end[0]);
    this.$rubberband.style('left', start[0] + 'px');
    this.$rubberband.style('width', end[0] - start[0] + 'px');
  }

  snapBand(sel: d3.Selection<any>) {
    console.assert(sel[0].length > 1);
    const first = sel[0][0];
    const last = sel[0][sel[0].length - 1];
    const start = (<any>first).offsetLeft + 10;
    const width = ((<any>last).offsetLeft + 10 - start) + 25;
    this.$rubberband.style('left',start + 'px');
    this.$rubberband.style('width', width + 'px');
  }

}
