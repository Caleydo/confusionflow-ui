/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IAppView} from './app';
import {extractEpochId} from './utils';

class NodeWrapper {
  public canBeRemoved = false;
  public condense = false;
  constructor(public name, public dps: DataPoint[]) {

  }
}

class OverallTimeline {
  public dataPoints: NodeWrapper[] = [];

  shrinkTimelines() {
    let visibleNodeCounter = 0;
    for(const dp of this.dataPoints) {
      this.removeEmpty(dp);
      if(dp.canBeRemoved) {
        continue;
      }
      this.consdenseNodes(dp, visibleNodeCounter);
      visibleNodeCounter++;
    }
  }

  removeEmpty(epochsAti: NodeWrapper) {
    const existingEpochs = epochsAti.dps.filter((x) => x && x.exists);
    let val = false;
    if(existingEpochs.length === 0) {
      val = true;
    }
    epochsAti.canBeRemoved = val;
    epochsAti.dps.map((x) => x.canBeRemoved = val);
  }

  consdenseNodes(epochsAti: NodeWrapper, visibleNodeCounter: number) {
    let val = false;
    if(visibleNodeCounter % AppConstants.TML_NODE_DENSITY_DISTANCE !== 0) {
      val = true;
    }
    epochsAti.condense = val;
    epochsAti.dps.map((x) => x.condense = val);
  }
}

class TimelineCollection {
  private timelines:Timeline[] = [];
  private $labels: d3.Selection<any> = null;
  private otl: OverallTimeline;

  timelineCount(): number {
    return this.timelines.length;
  }
  add(timeline: Timeline, epochInfos: IMalevoEpochInfo[]) {
    this.timelines.push(timeline);
    const tmData = new TimelineData(epochInfos);
    timeline.data = tmData;
    this.updateTimelines();
  }

  remove(ds: MalevoDataset) {
    const ts = this.timelines.find((x) => x.data.epochs === ds.epochInfos);
    console.assert(ts);
    ts.node().remove();
    this.timelines = this.timelines.filter((x) => x !== ts); // remove from list
    this.updateTimelines();
  }

  updateOverallTimeline() {
    this.otl = new OverallTimeline();
    const largestValue = this.getMaxEpoch();
    for(let i = 0; i <= largestValue; i++) {
      const epochsAti = [];
      this.timelines.forEach((x) => {
        if (i < x.data.datapoints.length) {
          epochsAti.push(x.data.datapoints[i]);
        }
      });

      this.otl.dataPoints.push(new NodeWrapper(i, epochsAti));
    }
  }

  updateTimelines() {
    this.updateOverallTimeline();
    this.otl.shrinkTimelines();
    const labelMargin = 10;
    const maxDSLabelWidth = this.findMaxDSLabelWidth();
    this.timelines.forEach((x, i) => {
      x.render(maxDSLabelWidth + labelMargin, i * AppConstants.TML_HEIGHT);
    });
    if(this.timelines.length > 0) {
      this.renderLabels(maxDSLabelWidth + labelMargin, 24);
    }
  }

  private findMaxDSLabelWidth() {
      return this.timelines.reduce((acc, val) => {
        return acc > val.getDSLabelWidth() ? acc : val.getDSLabelWidth();
      }, 0);
  }

  private renderLabels(offsetH: number, offsetV: number) {
    if(this.$labels) {
      this.$labels.remove();
      this.$labels = null;
    }

    this.$labels = this.timelines[this.timelines.length - 1].node()
      .append('g');

    const $g = this.$labels.classed('x axis', true)
      .style('fill', '#000')
      .attr('transform', 'translate(' + offsetH + ',' + offsetV + ')')
      .selectAll('text')
      .data(this.otl.dataPoints.filter((x) => !x.canBeRemoved));

    $g.enter()
      .append('text')
      .attr('dy', '.71em')
      .style('text-anchor', 'middle')
      .attr('width', (d) => d.condense ? AppConstants.TML_CONDENSED_BAR_WIDTH : AppConstants.TML_BAR_WIDTH)
      .text((d) => d.condense ? '' : d.name)
      .each(function (d, i) {
          let x = 0;
          if(this.previousSibling) {
            x = +this.previousSibling.getAttribute('x') + +this.previousSibling.getAttribute('width');
            x += AppConstants.TML_BAR_MARGIN ;
          }
          this.setAttribute('x', x);
          this.setAttribute('transform',`translate(${this.getAttribute('width') / 2}, 0)`);
        });
  }

  private getMaxEpoch() {
    const maxEpochs = this.timelines.map((x) => x.data.datapoints[x.data.datapoints.length - 1].position);
    return Math.max(...maxEpochs);
  }
}

class TimelineData {
  constructor(public epochs: IMalevoEpochInfo[]) {
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
  public canBeRemoved = false;
  public condense = false;
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
      this.$node.classed('hidden', timeLineCount === 0);
  }

  private attachListener() {
    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds:MalevoDataset) => {
      const ts = new Timeline(ds.name, this.$node);
      this.updateSvg(this.timelineData.timelineCount() + 1);
      this.timelineData.add(ts, ds.epochInfos);
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds:MalevoDataset) => {
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

class Timeline {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $axisX: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;

  data:TimelineData = null;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g');
    this.build(datasetName);
  }

  build(datasetName: string) {
    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + 15 +')')
      .append('text')
      .attr('font-size', AppConstants.TML_DS_LABEL_HEIGHT)
      .text(datasetName);
  }

  getDSLabelWidth(): number {
    return (<any>this.$label[0][0]).getBBox().width;
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
      .data(this.data.datapoints.filter((x) => !x.canBeRemoved))
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('y', 0)
        .attr('height', AppConstants.TML_BAR_HEIGHT)
        .attr('width', (d) => d.condense ? AppConstants.TML_CONDENSED_BAR_WIDTH : AppConstants.TML_BAR_WIDTH)
        .classed('hidden', (d) => !d.exists)
      .each(function () {
        let x = 0;
        if(this.previousSibling) {
          x = +this.previousSibling.getAttribute('x') + +this.previousSibling.getAttribute('width');
          x += AppConstants.TML_BAR_MARGIN;
        }
        this.setAttribute('x', x);
      });
  }
}
