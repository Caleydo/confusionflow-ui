/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from '../MalevoDataset';
import * as d3 from 'd3';
import {AppConstants} from '../AppConstants';
import {extractEpochId} from '../utils';
import {dataStoreTimelines, DataStoreSelectedRun, TimelineParameters} from '../DataStore';
import * as events from 'phovea_core/src/event';

export class OverallTimeline {
  public dataPoints: string[] = [];
}

export class TimelineData {
  constructor(epochs: IMalevoEpochInfo[]) {
    this.build(epochs);
  }
  datapoints: DataPoint[] = [];

  build(epochs: IMalevoEpochInfo[]) {
    function sortNumber(a: IMalevoEpochInfo, b: IMalevoEpochInfo) {
      return extractEpochId(a) - extractEpochId(b);
    }

    epochs.sort(sortNumber);
    const length = epochs[epochs.length - 1].id;
    for (let i = 0; i <= length; i++) {
      const epoch = epochs.find((x) => x.id === i);
      const dp = epoch ? new DataPoint(true, i, epoch) : new DataPoint(false, i, epoch);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  constructor(public exists: boolean, public position: number, public epoch: IMalevoEpochInfo) {

  }
}

export class Timeline {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  data: TimelineData = null;
  readonly MARGIN_LEFT = 0; // 20 pixel margin from left border
  readonly SHOW_LABEL = false;
  readonly tickmarkDistance = 5; // show ticks every 5 epoch
  readonly globalOffsetV = 15;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.build($parent);
  }

  build($parent) {
    if (this.$node) {
      this.$node.remove();
    }
    this.$node = $parent.append('g')
      .classed('timeline', true);
    this.createLabel(this.datasetName);
  }

  createLabel(datasetName: string) {
    if (!this.SHOW_LABEL) {
      return;
    }

    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + this.globalOffsetV + ')')
      .append('text')
      .classed('tml-label', true)
      .style('fill', dataStoreTimelines.get(this.datasetName).color)
      .text(datasetName);
  }

  getDSLabelWidth(): number {
    return (this.$label) ? (<any>this.$label[0][0]).getBBox().width : 0;
  }

  getWidth(): number {
    return (<any>this.$node[0][0]).getBBox().width;
  }

  node(): d3.Selection<any> {
    return this.$node;
  }

  render($parent, offsetH: number, offsetV: number) {
    this.build($parent);
    this.$node.attr('transform', `translate(${this.MARGIN_LEFT}, ${offsetV})`);

    const width = this.data.datapoints.length * 5;
    const x = d3.scale.ordinal()
      .rangePoints([0, width])
      .domain(this.data.datapoints.map(function (d) {
        return String(d.position);
      }));

    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(x.domain().filter((d, i) => {
        return i < this.data.datapoints.length && this.data.datapoints[i].exists && i % this.tickmarkDistance === 0;
      }))
      .orient('bottom')
      .tickSize(-7);

    this.$node.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${offsetH}, ${this.globalOffsetV})`)
      .call(xAxis);

    const that = this;
    // Draw the brush
    const brush = d3.svg.brush()
      .x(<any>x);


    const $brushg = this.$node.append('g')
      .attr('transform', `translate(${offsetH}, 0)`)
      .attr('class', 'brush')
      .call(brush);

    $brushg.select('.extent')
      .style('fill', 'grey');

    brush.on('brush', () => this.brushmove(x, brush))
      .on('brushend', () => that.brushAndFire(x, brush));

    const brushHeight = 15;
    $brushg.selectAll('rect')
      .attr('height', brushHeight);

    this.setBrush(brush, x, width);

    if (this.$label) {
      this.$label.on('dblclick', () => {
        // if at least 1 epoch was selected
        if (!brush.empty()) {
          //to clear the brush, call this.setBrush(brush, x, 0);
          this.setBrush(brush, x, width);
          events.fire(AppConstants.EVENT_REDRAW);
        }

      });
    }
  }

  setBrush(brush: any, x: any, width: number) {
    brush.extent([0, width]);
    this.brushmove(x, brush);
    this.brushend(x, brush);
  }

  ceil(val: number) {
    if (val < 0) {
      return 0;
    } else if (val >= this.data.datapoints.length) {
      return this.data.datapoints.length - 1;
    }
    for (let i = val; i < this.data.datapoints.length; i++) {
      if (this.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  floor(val: number) {
    if (val < 0) {
      return 0;
    } else if (val >= this.data.datapoints.length) {
      return this.data.datapoints.length - 1;
    }
    for (let i = val; i >= 0; i--) {
      if (this.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  brushmove(x: any, brush: any) {
    const extent = brush.extent();
    const y = d3.scale.linear().range(x.domain()).domain(x.range());

    if (!brush.empty()) {
      const range = this.getDataIndices(+y(<number>extent[0]), +y(<number>extent[1]));
      if (range[0] < range[1]) {
        this.$node.select('g.brush').call(<any>brush.extent([y.invert(range[0]), y.invert(range[1])]));
        events.fire(AppConstants.EVENT_TIMELINE_CHANGED, this);
      } else {
        this.$node.select('g.brush').call(<any>brush.clear());
      }
    }
  }

  brushAndFire(x: any, brush: any) {
    this.brushend(x, brush);
    events.fire(AppConstants.EVENT_REDRAW);
  }

  brushend(x: any, brush: any) {
    // if at least 1 epoch was selected
    if (!brush.empty()) {
      const extent = brush.extent();
      const y = d3.scale.linear().range(x.domain()).domain(x.range());
      const range = this.getDataIndices(+y(<number>extent[0]), +y(<number>extent[1]));

      TimelineParameters.setRange(range[0], range[1]);
      DataStoreSelectedRun.updateRuns();
    } else {
      TimelineParameters.setRange(-1, -1);
      DataStoreSelectedRun.updateRuns();
      this.$node.select('g.brush').call(<any>brush.clear());
    }
  }

  getSelectedEpochs(range: [number, number]) {
    const selEpochs = [];
    for (let i = range[0]; i <= range[1]; i++) {
      if (this.data.datapoints[i].exists) {
        selEpochs.push(this.data.datapoints[i].epoch);
      }
    }
    return selEpochs;
  }

  getDataIndices(n0: number, n1: number): [number, number] {
    if (n0 > n1) {
      const tmp = n1;
      n1 = n0;
      n0 = tmp;
    }

    n0 = Math.round(n0);
    n1 = Math.round(n1);
    const brushStart = this.ceil(Math.ceil(n0));
    const brushEnd = this.ceil(Math.ceil(n1));

    return [brushStart, brushEnd];
  }
}
