import {AppConstants} from '../AppConstants';
import {IMalevoEpochInfo, MalevoDataset} from '../MalevoDataset';
import {OverallTimeline, Timeline, TimelineData} from './Timeline';
import * as d3 from 'd3';
import {DataStoreTimelineSelection, dataStoreTimelines} from '../DataStore';
import * as events from 'phovea_core/src/event';
import Ordinal = d3.scale.Ordinal;

export class TimelineCollection {
  private timelines: Timeline[] = [];
  private otl: OverallTimeline;
  private timelineColors: string[] = [];

  constructor(private $node: d3.Selection<any>) {
    this.createColors();
  }

  createColors() {
    const colorScale = d3.scale.category10();
    for (let i = 0; i < AppConstants.MAX_DATASET_COUNT; i++) {
      this.timelineColors.push(colorScale(String(i)));
      this.timelines.push(null);
    }
  }

  getFreeIndex() {
    const index = this.timelines.findIndex((x) => x === null);
    console.assert(index >= 0 && index < AppConstants.MAX_DATASET_COUNT);
    return index;
  }

  timelineCount(): number {
    return this.timelines.filter((x) => x !== null).length;
  }

  add($node: d3.Selection<any>, ds: MalevoDataset) {
    this.createNewTimeline(ds);
    this.updateTimelines();
    events.fire(AppConstants.EVENT_REDRAW);
  }

  createNewTimeline(ds: MalevoDataset) {
    const freeIndex = this.getFreeIndex();
    const timelineSelection = new DataStoreTimelineSelection();
    dataStoreTimelines.set(ds.name, timelineSelection);
    timelineSelection.selectedDataset = ds;
    timelineSelection.datasetColor = this.timelineColors[this.getFreeIndex()];
    timelineSelection.indexInTimelineCollection = freeIndex;

    const timeline = new Timeline(ds.name, this.$node);
    this.timelines[freeIndex] = timeline;
    const tmData = new TimelineData(ds.epochInfos);
    timeline.data = tmData;
  }

  remove(ds: MalevoDataset) {
    const timelineIndex = this.timelines.findIndex((x) => x !== null && x.datasetName === ds.name);

    this.timelines[timelineIndex].detachListeners();

    // delete from datastore
    console.assert(dataStoreTimelines.get(this.timelines[timelineIndex].datasetName) !== null);
    dataStoreTimelines.delete(this.timelines[timelineIndex].datasetName);

    // delete from here
    console.assert(!!this.timelines[timelineIndex]);
    this.timelines[timelineIndex].node().remove();
    this.timelines[timelineIndex] = null; // remove from list
    this.updateTimelines();
    events.fire(AppConstants.EVENT_REDRAW);
  }

  updateOverallTimeline() {
    this.otl = new OverallTimeline();
    const largestValue = this.getMaxEpoch();
    for (let i = 0; i <= largestValue; i++) {
      this.otl.dataPoints.push(i.toString());
    }
  }

  updateTimelines() {
    this.updateOverallTimeline();
    const maxDSLabelWidth = this.findMaxDSLabelWidth();
    const marginLabelTimeline = 10; // 10 pixel margin between label and timeline
    let counter = 0;
    this.timelines.forEach((x) => {
      if (x !== null) {
        x.render(this.$node, maxDSLabelWidth + marginLabelTimeline, counter * AppConstants.TML_HEIGHT, this.otl);
        counter++;
      }
    });
  }

  private findMaxDSLabelWidth() {
    return this.timelines.reduce((acc, val) => {
      return val !== null && val.getDSLabelWidth() > acc ? val.getDSLabelWidth() : acc;
    }, 0);
  }

  private getMaxEpoch() {
    const maxEpochs = this.timelines.map((x) => x !== null ? x.data.datapoints[x.data.datapoints.length - 1].position : 0);
    return Math.max(...maxEpochs);
  }
}
