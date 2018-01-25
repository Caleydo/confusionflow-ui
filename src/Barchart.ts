import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './MalevoDataset';

export class Barchart {
  private readonly $node: d3.Selection<any>;

  constructor($parent: d3.Selection<any>, private readonly bins: number[]) {
    this.$node = $parent
      .append('svg')
      .classed('barchart', true)
      .attr('width', '100%')
      .attr('height', '100%');
  }

  private update(epochData:IMalevoEpochInfo) {
    this.render();
  }

  render() {
    const svg = this.$node;
    const barWidth = 2;
    const margin = {top: 5, bottom: 5};
    const width = (<any>svg[0][0]).clientWidth;
    const height = (<any>svg[0][0]).clientHeight - margin.top - margin.bottom;

    const x = d3.scale.linear().domain([0, 9]).rangeRound([0, width-barWidth]);
    const y = d3.scale.linear().rangeRound([height, 0]);
    y.domain([0, d3.max(this.bins, (d) => { return d; })]);

    const g = svg.append('g')
      .attr('transform', 'translate(' + '0' + ',' + margin.top + ')');

    g.selectAll('.bar')
    .data(this.bins)
    .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', function(d, i) { return x(i); })
      .attr('y', function(d) { return y(d); })
      .attr('width', barWidth + 'px')
      .attr('height', function(d) { return height - y(d); });
  }
}
