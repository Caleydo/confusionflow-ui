/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from '../MalevoDataset';
import * as d3 from 'd3';
import {AppConstants} from '../AppConstants';
import {extractEpochId} from '../utils';
import {Rangeband} from './Rangeband';

export class NodeWrapper {
  public canBeRemoved = false;
  public condense = false;
  constructor(public name, public dps: DataPoint[]) {

  }
}

export class OverallTimeline {
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

export class TimelineData {
  constructor(public epochs: IMalevoEpochInfo[]) {
    this.build(epochs);
  }
  datapoints: DataPoint[] = [];

  build(epochs: IMalevoEpochInfo[]) {
    function sortNumber(a: IMalevoEpochInfo, b: IMalevoEpochInfo) {
      return extractEpochId(a) - extractEpochId(b);
    }

    epochs.sort(sortNumber);
    const length = extractEpochId(epochs[epochs.length - 1]);
    for(let i = 0; i <= length; i++) {
      const epoch = epochs.find((x) => extractEpochId(x) === i);
      const dp = epoch ? new DataPoint(true, i, epoch) : new DataPoint(false, i, epoch);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  public canBeRemoved = false;
  public condense = false;
  constructor(public exists: boolean, public position: number, public epoch: IMalevoEpochInfo) {

  }
}

export class Timeline {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;
  private readonly MAX_DRAG_TOLERANCE = 10; // defines how many pixels are interpreted as click until it switches to drag
  private readonly rectSelector = '.epoch';
  data:TimelineData = null;
  private brush: d3.svg.Brush<any>;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g')
      .classed('timeline', true);
    this.createLabel(datasetName);
  }

  createLabel(datasetName: string) {
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

  render(offsetH: number, offsetV: number, otl: OverallTimeline) {
    this.$node.attr('transform', 'translate(0,' + offsetV + ')');

    offsetH += 10;
    const width = otl.dataPoints.length * 5;
    const x = d3.scale.ordinal()
      .rangePoints([0, width])
      .domain(otl.dataPoints.map(function (d) {
        return String(d.name);
      }));

    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(x.domain().filter((d, i) => {
        const cond = i < this.data.datapoints.length && this.data.datapoints[i].exists;
        return cond;
      }))
      .orient('bottom')
      .tickSize(-7);

    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }

    this.$rectangles = this.$node.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${offsetH}, 15)`)
      .call(xAxis);

    // Draw the brush
    this.brush = d3.svg.brush()
        .x(<any>x)
        .on('brush', () => this.brushmove(x, this))
        .on('brushend', () => this.brushend(x, otl));

    const brushg = this.$node.append('g')
      .attr('transform', `translate(${offsetH}, 0)`)
      .attr('class', 'brush')
      .call(this.brush);

    brushg.selectAll('rect')
        .attr('height', 15);
  }

  ceil(val: number, timeline: Timeline) {
    for(let i = val; i < timeline.data.datapoints.length; i++) {
      if(timeline.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  floor(val: number, timeline: Timeline) {
    for(let i = val; i >= 0; i--) {
      if(timeline.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  brushmove(x: any, timeline: Timeline) {
    const b = this.brush.extent();
    console.log(b);

    const y = d3.scale.linear().range(x.domain()).domain(x.range());
    //const invert = (val: number) => d3.scale.quantize().domain(x.range()).range(x.domain())(val);

    if(!this.brush.empty()) {
      let n0 = +y(<number>b[0]);
      let n1 = +y(<number>b[1]);


      if(n0 > n1) {
        const tmp = n1;
        n1 = n0;
        n0 = tmp;
      }
      const brushStart = this.ceil(Math.ceil(n0), timeline);
      const brushEnd =  this.ceil(Math.ceil(n1), timeline);

      if(brushStart < brushEnd) {
        d3.select('g.brush').call(<any>this.brush.extent([y.invert(brushStart), y.invert(brushEnd)]));
        console.log('Brush: ' + this.brush.extent());
      } else {
        d3.select('g.brush').call(<any>this.brush.clear());
      }
    } else {
    }

  }

  brushend(x: any, otl: OverallTimeline) {
    console.log('end');
  }
}
