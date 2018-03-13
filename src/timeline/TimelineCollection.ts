import {AppConstants} from '../AppConstants';
import {IMalevoEpochInfo, MalevoDataset} from '../MalevoDataset';
import {NodeWrapper, OverallTimeline, Timeline, TimelineData} from './Timeline';
import * as d3 from 'd3';
import {DataStoreEpochSelection} from '../DataStore';

export class TimelineCollection {
  private timelines:Timeline[] = [];
  private $labels: d3.Selection<any> = null;
  private otl: OverallTimeline;
  private $node: d3.Selection<any>;

  timelineCount(): number {
    return this.timelines.length;
  }
  add($node: d3.Selection<any>, ds:MalevoDataset) {
    DataStoreEpochSelection.labels = ds.classLabels;
    this.$node = $node;
    const timeline = new Timeline(ds.name, this.$node);
    this.timelines.push(timeline);
    const tmData = new TimelineData(ds.epochInfos);
    timeline.data = tmData;
    this.updateTimelines();
  }

  remove(ds: MalevoDataset) {
    const ts = this.timelines.find((x) => x.data.epochs === ds.epochInfos);
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
      x.render(maxDSLabelWidth, i * AppConstants.TML_HEIGHT, this.otl);
    });
   // if(this.timelines.length > 0) {
   //   this.renderLabels(maxDSLabelWidth, (this.timelines.length - 1) * AppConstants.TML_HEIGHT + 18);
   // }
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

    this.$labels = this.$node.append('g');
    this.$labels.classed('labels', true)
      .attr('transform', 'translate(' + offsetH + ',' + offsetV + ')')
      .selectAll('text')
      .data(this.otl.dataPoints.filter((x) => !x.canBeRemoved))
      .enter()
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
