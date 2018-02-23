import {ADetailWindow} from './ADetailWindow';
import {DataStoreCellSelection} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, NumberMatrix} from '../DataStructures';
import {Language} from '../language';

export class DetailChartWindow extends ADetailWindow {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  private readonly STROKE_WIDTH = 3;

  constructor(name: string, $parent: d3.Selection<any>) {
    super(name, $parent);

    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    this.$header = this.$node
      .append('div')
      .classed('chart-name', true);

    this.$svg = this.$node
      .append('svg')
      .attr('viewBox', `-30 0 ${this.width} 300`);
  }

  createHeaderText() {
    let text = '';
    switch(DataStoreCellSelection.cellName) {
      case Language.FP:
        text = 'False Positive Rate';
        break;
      case Language.FN:
        text = 'False Negative Rate';
        break;
      case Language.PREDICTED_AS:
        const rowLabel = DataStoreCellSelection.multiEpochData.values[0][DataStoreCellSelection.rowIndex].label;
        const colLabel = DataStoreCellSelection.multiEpochData.values[0][DataStoreCellSelection.colIndex].label;
        text = rowLabel + ' ' + Language.PREDICTED_AS + ' ' + colLabel;
        break;
    }
    this.$header.text(text);
  }

  render() {
    console.assert(DataStoreCellSelection.multiEpochData !== null);
    this.createHeaderText();
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

    // combined cells will be handled like single line cells
    if(DataStoreCellSelection.type === AppConstants.SINGLE_LINE_CHART_CELL || DataStoreCellSelection.type === AppConstants.COMBINED_CELL) {
      const lineDataOneCell = DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.rowIndex][DataStoreCellSelection.colIndex];
      this.renderSingleLine(lineDataOneCell, x, y);
    } else if(DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL) {
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

    const axisDistance = 100;
    // now add titles to the axes
    this.$g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (-axisDistance/2) +','+(this.height/2)+')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
        .text('Value');

    this.$g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (this.width/2) +','+(this.height-(-axisDistance/3))+')')  // centre below axis
        .text('Date');
  }

  //TODO types for x and y
  renderSingleLine(lineDataOneCell: IClassEvolution, x, y) {
    this.$g.classed('linechart', true);
    const line = d3_shape.line()
      .x((d, i) => x(i))
      .y((d) => y(d));

    this.$g.append('path')
      .classed('detail-view-line', true)
      .attr('d', line(lineDataOneCell.values))
      .style('stroke-width', this.STROKE_WIDTH);
  }

  renderMultiLine(data: IClassEvolution[], x, y) {
    this.$g.classed('multilinechart', true);
    const z = d3.scale.category10()
      .domain(data.map((c) => c.label));

    const line = d3_shape.line()
      .x((d, i) => x(i))
      .y((d) => y(d));

    const $epochLine = this.$g.selectAll('.detail-view-line')
    .data(data)
    .enter().append('path')
      .classed('detail-view-line', true)
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.label))
      .style('stroke-width', this.STROKE_WIDTH)
      .append('title')
      .text((d) => d.label);
  }
}
