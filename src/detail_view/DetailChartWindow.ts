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
    this.init();
  }

  render() {
    if(DataStoreCellSelection.currentCellState === AppConstants.COMBINED_EPOCH_CELL) {
      this.renderMultiEpochData();
    }
  }

  init() {
    this.$svg = this.$node.append('svg');
  }

  renderMultiEpochData() {
    const margin = {top: 20, right: 50, bottom: 30, left: 50};
    this.width = (<any>this.$svg[0][0]).clientWidth - margin.left - margin.right;
    this.height = (<any>this.$svg[0][0]).clientHeight - margin.top - margin.bottom;
    if (this.$g !== null) {
      this.$g.remove();
    }
    this.$g = this.$svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');


    const data = DataStoreCellSelection.multiEpochData;
    const lineData1D = DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.rowIndex][DataStoreCellSelection.colIndex];
    const maxVal = Math.max(...lineData1D.values);

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    const z = d3.scale.category10();

    x.domain([0, lineData1D.values.length]);
    y.domain([0, maxVal]);

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const xAxis = d3.svg.axis()
      .scale(x)
      .tickSize(-this.height);

    const yAxis = d3.svg.axis()
      .scale(y)
      .ticks(4)
      .orient('right');

    this.$g.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

    this.$g.append('g')
      .attr('class', 'y axis')
      .attr('transform', 'translate(' + this.width + ',0)')
      .call(yAxis);

    this.$g.append('path')
      .data([lineData1D.values])
      .attr('d', line);

    /*this.$g.append('g')
     .attr('transform', 'translate(0,' + this.height + ')')
     .call(d3.svg.axis().orient('bottom'))
     .select('.domain')
     .remove();

     this.$g.append('g')
     .call(d3.svg.axis().orient('left'))
     .append('text')
     .attr('fill', '#000')
     .attr('transform', 'rotate(-90)')
     .attr('y', 6)
     .attr('dy', '0.71em')
     .attr('text-anchor', 'end')
     .text('Price ($)');
     }*/
  }
}
