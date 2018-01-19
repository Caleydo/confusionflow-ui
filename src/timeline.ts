/**
 * Created by Martin on 04.01.2018.
 */

import {IMalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IDragSelection} from './range_selector';
import RangeSelector from './range_selector';
import {IAppView} from './app';

export default class Timeline implements IDragSelection, IAppView {
  private readonly $node:d3.Selection<any>;
  private $circles:d3.Selection<any>;
  private $rubberband: d3.Selection<any>;
  private isDragging = false;

  constructor(parent: Element) {
    this.$node = d3.select(parent).append('div').attr('id', 'timeline');
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items:IMalevoDataset) => {
     this.updateItems(items);
    });
  }

    /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<HeatMap>}
   */
  init() {
    this.attachListener();

    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
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
        const $epochDiv = d3.select(this);
            $epochDiv.classed('loading', false);
            $epochDiv.html(`<div class="point"></div>
                            <div class="label">${epochInfo.name}</div>`);
      });
    $circles.exit().remove();
    this.$circles = $circles;
    new RangeSelector(this.$node, this.$node.selectAll('div.epochs')).addListener(this);
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
      if(this.isDragging) { // if one point was selected by dragging => hide the band
        this.$rubberband.style('visibility', 'hidden');
      }
    }
    //this.$circles.style('border-color', 'black');
    sel.style('border-color', 'red');
    this.isDragging = false;
    //events.fire(AppConstants.EVENT_EPOCH_SELECTED, sel);
  }

  dragStart() {
  }

  dragging(start: [number, number], end: [number, number]) {
    console.assert(start[0] <= end[0]);
    if(end[0] - start[0] > 10) {
      this.isDragging = true;
      this.$rubberband.style('visibility', 'visible');
      this.$rubberband.style('left', start[0] + 'px');
      this.$rubberband.style('width', end[0] - start[0] + 'px');
    }
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

  /**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent:Element, options:any) {
  return new Timeline(parent);
}
