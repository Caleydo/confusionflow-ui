/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IDragSelection} from './RangeSelector';
import {TimelineRangeSelector} from './RangeSelector';
import {IAppView} from './App';

export default class Timeline implements IDragSelection, IAppView {
  private readonly $node:d3.Selection<any>;
  private $circles:d3.Selection<any>;
  private $rangeband: d3.Selection<any>;
  private isDragging = false;
  private readonly ELEMENT_WIDTH = 25; // adapt in _timeline.scss if necessary
  private readonly MAX_DRAG_TOLERANCE = 10; // defines how many pixels are interpreted as click until it switches to drag
  private readonly OFFSET = 10; // Offset from the left border
  private rangeSelector: TimelineRangeSelector;
  private malevoDataset: MalevoDataset;

  constructor(parent: Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('timeline', true);
    this.rangeSelector = new TimelineRangeSelector(this.$node);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_COLLECTION_SELECTED, (evt, items:MalevoDataset) => {
     this.updateItems(items);
    });
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.rangeSelector.addListener(this);
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

  private createRangeband() {
    this.$rangeband = this.$node.append('div').classed('selection', true);
  }

  updateItems(malevoData: MalevoDataset) {
    const that = this;
    this.malevoDataset = malevoData;
    this.createRangeband();
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
    this.rangeSelector.updateCandidateList(this.$node.selectAll('div.epochs'));
  }

  dragEnd(sel: d3.Selection<any>) {
    console.assert(sel.length === 1);
    if(sel[0].length > 1) {
      this.$circles.classed('range-selected', false);
      this.snapBand(sel);
      sel.classed('range-selected', true);
    } else {
      this.$circles.classed('single-selected', false);
      sel.classed('single-selected', true);
      if(this.isDragging) { // if one point was selected by dragging => hide the band
        this.$rangeband.style('visibility', 'hidden');
      }
    }
    events.fire(AppConstants.EVENT_EPOCH_SELECTED, sel.data(), this.malevoDataset);
    sel.style('border-color', 'red');
    this.isDragging = false;
  }

  dragStart() {
     // nothing
  }

  dragging(start: [number, number], end: [number, number]) {
    console.assert(start[0] <= end[0]);
    if(end[0] - start[0] > this.MAX_DRAG_TOLERANCE) {
      this.isDragging = true;
      this.$rangeband.style('visibility', 'visible');
      this.$rangeband.style('left', start[0] + 'px');
      this.$rangeband.style('width', end[0] - start[0] + 'px');
    }
  }

  snapBand(sel: d3.Selection<any>) {
    console.assert(sel[0].length > 1);
    const first = sel[0][0];
    const last = sel[0][sel[0].length - 1];
    const start = (<any>first).offsetLeft + this.OFFSET;
    const width = ((<any>last).offsetLeft + this.OFFSET - start) + this.ELEMENT_WIDTH;
    this.$rangeband.style('left',start + 'px');
    this.$rangeband.style('width', width + 'px');
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
