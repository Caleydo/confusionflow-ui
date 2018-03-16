import {AppConstants} from '../AppConstants';
import {IMalevoEpochInfo, MalevoDataset} from '../MalevoDataset';
import {OverallTimeline, Timeline, TimelineData} from './Timeline';
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
      this.otl.dataPoints.push(i.toString());
    }
  }

  updateTimelines() {
    this.updateOverallTimeline();
    const maxDSLabelWidth = this.findMaxDSLabelWidth();
    const marginLabelTimeline = 10; // 10 pixel margin between label and timeline
    this.timelines.forEach((x, i) => {
      x.render(this.$node, maxDSLabelWidth + marginLabelTimeline, i * AppConstants.TML_HEIGHT, this.otl);
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
