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
import {extractEpochId} from './utils';

class TimelineCollection {
  private timelines:Timeline[] = [];
  private maxLabelWidth = 0;
  private $labels: d3.Selection<any> = null;

  timelineCount(): number {
    return this.timelines.length;
  }
  add(timeline: Timeline) {
    this.timelines.push(timeline);
    const tmData = new TimelineDataPoints(timeline.dataset.epochInfos);
    timeline.data = tmData;
    this.updateTimelines();
  }

  remove(ds: MalevoDataset) {
    const ts = this.timelines.find((x) => x.dataset === ds);
    console.assert(ts);
    ts.node().remove();
    this.timelines = this.timelines.filter((x) => x !== ts); // remove from list
    this.updateTimelines();
  }

  updateTimelines() {
    const labelMargin = 10;
    this.findMaxLabelWidth();
    this.timelines.forEach((x, i) => {
      x.render(this.maxLabelWidth + labelMargin, i * AppConstants.TML_HEIGHT);
    });
    if(this.timelines.length > 0) {
      this.renderLabels(this.maxLabelWidth + labelMargin, this.timelines.length * AppConstants.TML_HEIGHT);
    }
  }

  private findMaxLabelWidth() {
      this.maxLabelWidth = this.timelines.reduce((acc, val) => {
        return acc > val.getLabelWidth() ? acc : val.getLabelWidth();
      }, this.maxLabelWidth);
  }

  private renderLabels(offsetH: number, offsetV: number) {
    if(this.$labels) {
      this.$labels.remove();
      this.$labels = null;
    }

    const largestValue = this.getMaxEpoch();
    const labels = [];
    for(let i = 0; i <= largestValue; i++) {
      labels.push(i);
    }
    this.$labels = this.timelines[this.timelines.length - 1].node()
      .append('g');

    const $g = this.$labels.classed('x axis', true)
      .style('fill', '#000')
      .attr('transform', 'translate(' + offsetH + ',' + 24 + ')')
      .selectAll('g')
      .data(labels);

    $g.enter()
      .append('g')
      .classed('tick', true)
      .style('fill', 'black')
      .append('text')
      .attr('dy', '.71em')
      .attr('x', (d, i) => (AppConstants.TML_BAR_WIDTH + AppConstants.TML_BAR_MARGIN) * i + AppConstants.TML_BAR_WIDTH / 2)
      .style('text-anchor', 'middle')
      .attr('width', AppConstants.TML_BAR_WIDTH)
      .text((d) => d);

  }

  private getMaxEpoch() {
    const maxEpochs = this.timelines.map((x) => x.data.datapoints[x.data.datapoints.length - 1].position);
    return Math.max(...maxEpochs);
  }

}
class TimelineDataPoints {
  constructor(epochs: IMalevoEpochInfo[]) {
    this.build(epochs);
  }
  datapoints: DataPoint[] = [];

  build(epochs: IMalevoEpochInfo[]) {
    function sortNumber(a,b) {
      return a - b;
    }
    const ids = epochs.map((x) => extractEpochId(x));
    ids.sort(sortNumber);
    for(let i = 0; i <= ids[ids.length - 1]; i++) {
      const dp = ids.includes(i) ? new DataPoint(true, i) : new DataPoint(false, i);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  constructor(public exists: boolean, public position: number) {

  }
}

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
  }

  private attachListener() {

    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds:MalevoDataset) => {
      const ts = new Timeline(ds, this.$node);
      this.timelineData.add(ts);

      this.updateSvg(this.timelineData.timelineCount());
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds:MalevoDataset) => {
      this.timelineData.remove(ds);
      this.updateSvg(this.timelineData.timelineCount());
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
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $axisX: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;

  data:TimelineDataPoints = null;

  constructor(public dataset: MalevoDataset, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g');
    this.build();
  }

  build() {
    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + 15 +')')
      .append('text')
      .attr('font-size', AppConstants.TML_DS_LABEL_HEIGHT)
      .text(this.dataset.name);
  }

  getLabelWidth(): number {
    return (<any>this.$label[0][0]).clientWidth;
  }

  node(): d3.Selection<any> {
    return this.$node;
  }

  render(offsetH: number, offsetV: number) {

    this.$node.attr('transform', 'translate(0,' + offsetV + ')');
    // Add a group for each cause.
    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }
    this.$rectangles = this.$node.append('g');
    this.$rectangles.attr('transform', 'translate(' + offsetH + ',' + 7 + ')')
      .selectAll('rect')
      .data(this.data.datapoints)
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function (d, i) {
            return (AppConstants.TML_BAR_WIDTH + AppConstants.TML_BAR_MARGIN) * i;
        })
        .attr('y', function (d) {
            return 0;
        })
        .attr('height', function (d) {
            return AppConstants.TML_BAR_HEIGHT;
        })
        .attr('width', AppConstants.TML_BAR_WIDTH)
        .style('visibility', (d) => d.exists ? 'visible' : 'hidden');
  }
}
