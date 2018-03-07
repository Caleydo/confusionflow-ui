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
import {IAppView} from './app';
import {DataStoreEpochSelection} from './DataStore';

export default class TimelineView implements IAppView {
  private readonly $node:d3.Selection<any>;
  private timelines:Timeline[] = [];

  constructor(parent: Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('timeline-view', true);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds:MalevoDataset) => {
      const ts = new Timeline(ds, this.$node);
      this.timelines.push(ts);
      ts.render();
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds:MalevoDataset) => {
      const ts = this.timelines.find((x) => x.dataset === ds);
      console.assert(ts);
      this.timelines = this.timelines.filter((x) => x !== ts); // remove from list
      ts.Node().remove();
    });
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent:Element, options:any) {
  return new TimelineView(parent);
}

class Timeline {
  private $node: d3.Selection<any>;
  constructor(public dataset: MalevoDataset, $parent: d3.Selection<any>) {
    this.$node = $parent.append('svg');
  }

  Node(): d3.Selection<any> {
    return this.$node;
  }

  render() {
    const margin = {top: 20, right: 20, bottom: 110, left: 40};
    const margin2 = {top: 430, right: 20, bottom: 30, left: 40};
    const width = +this.$node.attr('width') - margin.left - margin.right;
    const height = +this.$node.attr('height') - margin.top - margin.bottom;
    const height2 = +this.$node.attr('height') - margin2.top - margin2.bottom;

    const x = d3.time.scale()
    .domain([new Date(2013, 7, 1), new Date(2013, 7, 15)])
    .rangeRound([0, width]);

    this.$node.append('g')
    .attr('class', 'axis axis--grid')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.svg.axis().orient('bottom').scale(x)
        .ticks(d3.time.hour, 12)
        .tickSize(-height)
        .tickFormat(function() { return null; }))
    .selectAll('.tick')
    .classed('tick--minor', function(d) { return d.getHours(); });

    this.$node.append('g')
        .attr('class', 'axis axis--x')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.svg.axis().orient('bottom').scale(x)
            .ticks(d3.time.day)
            .tickPadding(0))
        .attr('text-anchor', null)
      .selectAll('text')
        .attr('x', 6);

    this.$node.append('g')
        .attr('class', 'brush')
        .call(d3.svg.brush()
            .extent([[0, 0], [width, height]]));
           /* .on('brushend', function() {
              if (!(<any>d3.event).sourceEvent) {
                return;
              } // Only transition after input.
              if (!((<any>d3.event).selection)) {
                return;
              } // Ignore empty selections.
              const d0 = (<any>d3.event).selection.map(x.invert),
                  d1 = d0.map(d3.time.day.round);

              // If empty when rounded, use floor & ceil instead.
              if (d1[0] >= d1[1]) {
                d1[0] = d3.time.day.floor(d0[0]);
                d1[1] = d3.time.day.offset(d1[0], 0);
              }
              d3.select(this).transition().call((<any>d3.event).target.move, d1.map(x));
            }));*/
  }


}
