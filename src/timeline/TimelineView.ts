/**
 * Created by Martin on 11.03.2018.
 */
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from '../AppConstants';
import {MalevoDataset} from '../MalevoDataset';
import {IAppView} from '../app';
import {TimelineCollection} from './TimelineCollection';
import {Timeline} from './Timeline';
import {DataStoreEpochSelection} from '../DataStore';

export default class TimelineView implements IAppView {
  private readonly $node:d3.Selection<any>;
  private timelineData: TimelineCollection;
  private width: number;

  constructor(parent: Element) {
    this.timelineData = new TimelineCollection();
    this.width = parent.clientWidth;

    this.$node = d3.select(parent)
      .append('svg')
      .classed('timeline-view', true)
      .attr('width', '100%')
      .attr('height', '0px')
      .attr('viewBox', `0 0 ${this.width} ${0}`);
  }

  updateSvg(timeLineCount: number) {
      this.$node.attr('viewBox', `0 0 ${this.width} ${(timeLineCount) * AppConstants.TML_HEIGHT}`);
      this.$node.attr('height', '100%');
      this.$node.classed('hidden', timeLineCount === 0);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds:MalevoDataset) => {
      DataStoreEpochSelection.clearSelection();
      const ts = new Timeline(ds.name, this.$node);
      this.updateSvg(this.timelineData.timelineCount() + 1);
      this.timelineData.add(ts, ds.epochInfos);
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds:MalevoDataset) => {
      DataStoreEpochSelection.clearSelection();
      this.updateSvg(this.timelineData.timelineCount() - 1);
      this.timelineData.remove(ds);
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
