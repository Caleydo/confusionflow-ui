/**
 * Created by Martin on 01.02.2018.
 */
import {IClassEvolution} from './DataStructures';
import * as d3 from 'd3';
//import {d3_shape} from 'd3-shape';

export class Linechart {
  private readonly $node: d3.Selection<any>;
  private readonly width: number;
  private readonly height: number;

  constructor($parent: d3.Selection<any>) {
    const $svg = $parent
      .append('svg')
      .classed('barchart', true);

    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    this.$node = $svg.append('g');
  }

  render(data: IClassEvolution) {
    const $g = this.$node;

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    x.domain([0, data.values.length]);
    y.domain([0, d3.max(data.values)]);

    /*const line = d3.
      .x(function(d) { return x(d.date); })
      .y(function(d) { return y(d.close); });

    $g.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "steelblue")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 1.5)
      .attr("d", line);*/
  }
}
