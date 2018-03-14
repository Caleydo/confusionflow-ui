/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from '../MalevoDataset';
import * as d3 from 'd3';
import {AppConstants} from '../AppConstants';
import {extractEpochId} from '../utils';

class SingleEpochSelector {
  public $node: d3.Selection<any>;
  public hidden = true;
  curPos = -1;
  constructor($parent: d3.Selection<any>, offsetH: number) {
    this.$node = $parent.append('rect').classed('single-epoch-selector', true).attr('width', 2).attr('height', 20).attr('y', 0)
      .attr('transform', `translate(${offsetH}, 0)`)
      .classed('hidden', this.hidden);
  }

  setPosition(pos: number) {
    if(this.curPos !== pos) {
      this.hidden = false;
    } else {
      this.hidden = true;
    }
    this.curPos = pos;
    this.$node.classed('hidden', this.hidden);
  }
}

export class NodeWrapper {
  public canBeRemoved = false;
  public condense = false;
  constructor(public name, public dps: DataPoint[]) {
  }
}

export class OverallTimeline {
  public dataPoints: NodeWrapper[] = [];
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
  data:TimelineData = null;
  singleEpochSelector = null;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
   this.build($parent);
  }

  build($parent) {
    if(this.$node) {
      this.$node.remove();
    }
    this.$node = $parent.append('g')
      .classed('timeline', true);
    this.createLabel(this.datasetName);
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

  render($parent, offsetH: number, offsetV: number, otl: OverallTimeline) {
    this.build($parent);
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

    this.$node.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${offsetH}, 15)`)
      .call(xAxis);

    const that = this;
    // Draw the brush
    const brush = d3.svg.brush()
        .x(<any>x);

    const $brushg = this.$node.append('g')
      .attr('transform', `translate(${offsetH}, 0)`)
      .attr('class', 'brush')
      .call(brush);
      brush.on('brush', () => {
          this.brushmove(x, brush);
        })
        .on('brushend', function() {that.brushend(x, otl, this, brush);});

    $brushg.selectAll('rect')
        .attr('height', 15);


    const rect = $brushg.append('text').attr('font-size', '15').style('fill', 'rgb(0,0.255').style('pointer-events', 'none');
    const invert = d3.scale.linear().range(<any>x.domain()).domain(x.range());
    const tml = this;
    $brushg
      .on('mousemove', function() {
        rect.classed('hidden', false);
        const coordinates = d3.mouse(this);
        const x = coordinates[0];
        const y = coordinates[1];
        rect.attr('x', x + 3);
        rect.attr('y', y - 3);
        const rounded = Math.round(invert(x));
        rect.text(rounded);

      })
      .on('mouseleave', () => {
        rect.classed('hidden', true);
      });

    const rect2 = this.$node.append('rect').style('fill', 'rgb(0,0.255').attr('width', 2).attr('height', 20).attr('y', 0)
      .attr('transform', `translate(${offsetH}, 0)`);

    this.singleEpochSelector = new SingleEpochSelector(this.$node, offsetH);
    this.$node.append('rect').attr('transform', `translate(${offsetH}, ${16})`)
      .attr('width', width)
      .attr('height', 20)
      .style('opacity', 0)
      .on('mousemove', function() {
        const coordinates = d3.mouse(this);
        const num = invert(coordinates[0]);
        rect2.attr('x',x(String(Math.round(num))));

      })
      .on('mouseup', function() {
        const coordinates = d3.mouse(this);
        const num = invert(coordinates[0]);
        const posX = x(String(Math.round(num)));
        tml.singleEpochSelector.$node.attr('x', posX);
        tml.singleEpochSelector.setPosition(posX);
      });
  }

  isNearlyInt(num: number) {
    const rounded = Math.round(num);
    return Math.abs(rounded - num) < 0.1;
  }

  ceil(val: number, timeline: Timeline) {
    for(let i = val; i < timeline.data.datapoints.length; i++) {
      if(timeline.data.datapoints[i].exists) {
        return i;
      }
    }
    return null;
  }

  brushmove(x: any, brush:any) {
    const b = brush.extent();

    const y = d3.scale.linear().range(x.domain()).domain(x.range());

    if(!brush.empty()) {
      let n0 = +y(<number>b[0]);
      let n1 = +y(<number>b[1]);

      if(n0 > n1) {
        const tmp = n1;
        n1 = n0;
        n0 = tmp;
      }
      const brushStart = this.ceil(Math.ceil(n0), this);
      const brushEnd =  this.ceil(Math.ceil(n1), this);

      if(brushStart < brushEnd) {
        this.$node.select('g.brush').call(<any>brush.extent([y.invert(brushStart), y.invert(brushEnd)]));
      } else {
        this.$node.select('g.brush').call(<any>brush.clear());
      }
    }
  }

  brushend(x: any, otl: OverallTimeline, ele: HTMLElement, brush) {
  }
}
