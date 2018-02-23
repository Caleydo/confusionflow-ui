import {ADetailWindow} from './ADetailWindow';
import {DataStoreCellSelection} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, NumberMatrix} from '../DataStructures';

export class DetailChartWindow extends ADetailWindow {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;

  constructor(name: string, $parent: d3.Selection<any>) {
    super(name, $parent);

    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    this.$svg = this.$node
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} 500`);
  }

  render() {
    const margin = {top: 20, right: 50, bottom: 30, left: 50};
    this.width = (<any>this.$node[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>this.$node[0][0]).clientHeight - margin.top - margin.bottom;
    if (this.$g !== null) {
      this.$g.remove();
    }

    this.$g = this.$svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    const maxVal = max(DataStoreCellSelection.multiEpochData, (d) => Math.max(...d.values));

    const x = d3.scale.linear()
      .rangeRound([0, this.width])
      .domain([0, DataStoreCellSelection.multiEpochData.values[0][0].values.length - 1]);

    const y = d3.scale.linear()
      .rangeRound([this.height, 0])
      .domain([0, maxVal]);

    this.renderAxis(x, y);
    if(DataStoreCellSelection.lineType === AppConstants.SINGLE_LINE) {
      const lineDataOneCell = DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.rowIndex][DataStoreCellSelection.colIndex];
      this.renderSingleLine(lineDataOneCell, x, y);
    } else if(DataStoreCellSelection.lineType === AppConstants.MULTI_LINE) {
      this.renderMultiLine(DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.colIndex], x, y);
    }

  }

  renderAxis(x, y) {
    const xAxis = d3.svg.axis()
      .scale(x);

    this.$g.append('g')
      .attr('class', 'chart-axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);


    const yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

    this.$g.append('g')
      .attr('class', 'chart-axis')
      .call(yAxis);
  }

  renderSingleLine(lineDataOneCell, x, y) {
    this.$g.classed('linechart', true);
    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    this.$g.append('path')
      .attr('d', line(lineDataOneCell.values));
  }

  renderMultiLine(data: IClassEvolution[], x, y) {
    this.$g.classed('multilinechart', true);
    const z = d3.scale.category10()
      .domain(data.map((c) => c.label));

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const $epochLine = this.$g.selectAll('path')
    .data(data)
    .enter().append('path')
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.label))
      .append('title')
      .text((d) => d.label);
  }
}
