import {ADetailView} from './ADetailView';
import {DataStoreCellSelection} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, NumberMatrix} from '../DataStructures';

export class DetailChartView extends ADetailView {
  private width: number;
  private height: number;
  private $g: d3.Selection<any>;

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
    const $svg = this.$node.append('svg');
    const margin = {top: 20, right: 20, bottom: 30, left: 50};
    this.width = +$svg.attr('width') - margin.left - margin.right;
    this.height = +$svg.attr('height') - margin.top - margin.bottom;
    this.$g = $svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
  }

  renderMultiEpochData() {
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

    this.$g.append('g')
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
    }
}
