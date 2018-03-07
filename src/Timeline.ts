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

class Timeline {
  private $node: d3.Selection<any>;
  constructor(public dataset: MalevoDataset, $parent: d3.Selection<any>) {
    this.$node = $parent.append('div').text(String(dataset));
  }

  Node(): d3.Selection<any> {
    return this.$node;
  }
}

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
