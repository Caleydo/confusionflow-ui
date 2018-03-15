import {AppConstants} from '../AppConstants';
import {IMalevoEpochInfo, MalevoDataset} from '../MalevoDataset';
import {NodeWrapper, OverallTimeline, Timeline, TimelineData} from './Timeline';
import * as d3 from 'd3';
import {DataStoreEpochSelection} from '../DataStore';

export class TimelineCollection {
  private timelines:Timeline[] = [];
  private otl: OverallTimeline;

  constructor(private $node: d3.Selection<any>) {

  }

  timelineCount(): number {
    return this.timelines.length;
  }

  add($node: d3.Selection<any>, ds: MalevoDataset) {
    DataStoreEpochSelection.labels = ds.classLabels;
    DataStoreEpochSelection.datasetName = ds.name;
    this.createNewTimeline(ds);
    this.updateTimelines();
  }

  createNewTimeline(ds: MalevoDataset) {
    const timeline = new Timeline(ds.name, this.$node);
    this.timelines.push(timeline);
    const tmData = new TimelineData(ds.epochInfos);
    timeline.data = tmData;
  }

  remove(ds: MalevoDataset) {
    const ts = this.timelines.find((x) => x.datasetName === ds.name);
    console.assert(!!ts);
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
    //this.otl.shrinkTimelines();
    const maxDSLabelWidth = this.findMaxDSLabelWidth();
    this.timelines.forEach((x, i) => {
      x.render(this.$node, maxDSLabelWidth, i * AppConstants.TML_HEIGHT, this.otl);
    });
  }

  private findMaxDSLabelWidth() {
      return this.timelines.reduce((acc, val) => {
        return acc > val.getDSLabelWidth() ? acc : val.getDSLabelWidth();
      }, 0);
  }

  private getMaxEpoch() {
    const maxEpochs = this.timelines.map((x) => x.data.datapoints[x.data.datapoints.length - 1].position);
    return Math.max(...maxEpochs);
  }
}
