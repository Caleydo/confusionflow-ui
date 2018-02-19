/**
 * Created by Martin on 01.02.2018.
 */
import {IClassEvolution} from './DataStructures';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {createTooltip} from './utils';

function addDashedLines($g: d3.Selection<any>, x: any, singleEpochIndex: number, height: number, width: number) {
  const $line = $g.append('line').attr('y1', 0).attr('y2', height);
  $line.classed('dashed-lines', true);
  $line.attr('x1', x(singleEpochIndex) + borderOffset($line, x(singleEpochIndex), width)).attr('x2', x(singleEpochIndex) + borderOffset($line, x(singleEpochIndex), width));
}

function borderOffset($line: d3.Selection<any>, posX: number, width: number) {
  let sw = parseInt($line.style('stroke-width'), 10);
  sw /= 2;
  if(posX === 0) {
    return sw;
  } else if(posX === width) {
    return -sw;
  }
  return 0;
}

export class LineChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>) {
    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    const $svg = $parent
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('linechart', true);

    this.$node = $svg.append('g');
  }

  render(data: IClassEvolution, maxVal: number, minVal: number, singleEpochIndex: number) {
    const $g = this.$node;

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    x.domain([0, data.values.length - 1]);
    y.domain([minVal, maxVal]);

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    $g.append('path').attr('d', line(data.values));
    if(singleEpochIndex > -1) {
      addDashedLines($g, x, singleEpochIndex, this.height, this.width);
    }
  }
}

export class MultilineChart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>, private lineCount: number) {
    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    const $svg = $parent
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('multilinechart', true);

    this.$node = $svg.append('g');
  }

  render(data: IClassEvolution[], maxVal: number, minVal: number, singleEpochIndex: number) {
    const $g = this.$node;

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    const z = d3.scale.category10();

    x.domain([0, this.lineCount]);
    y.domain([minVal, maxVal]);
    z.domain(data.map(function(c) { return c.label; }));

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const $epochLine = $g.selectAll('path.line')
    .data(data)
    .enter().append('path')
      .attr('class', 'line')
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.label));

    if(singleEpochIndex > -1) {
      addDashedLines($g, x, singleEpochIndex, this.height, this.width);
    }

    createTooltip(this.$node, $epochLine, (d) => d.label);
  }
}
