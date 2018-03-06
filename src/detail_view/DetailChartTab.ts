import {ADetailViewTab} from './ADetailViewTab';
import {DataStoreCellSelection, DataStoreEpoch} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassEvolution, max} from '../DataStructures';
import {Language} from '../language';
import {App} from '../app';

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

export class DetailChartTab extends ADetailViewTab {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  private readonly STROKE_WIDTH = 3;
  private $focus: d3.Selection<any>;

  constructor(id: string, name: string, $parent: d3.Selection<any>) {
    super(id, name, $parent);

    this.width = (<any>$parent[0][0]).clientWidth;
    this.height = (<any>$parent[0][0]).clientHeight;

    this.$header = this.$node
      .append('div')
      .classed('chart-name', true);

    this.$svg = this.$node
      .append('svg')
      .attr('viewBox', `0 0 ${this.width} 500`);
  }

  createHeaderText() {
    let text = '';
    switch(DataStoreCellSelection.type) {
      case AppConstants.BAR_CHART_CELL_FP:
        text = Language.FP_RATE;
        break;
      case AppConstants.BAR_CHART_CELL_FN:
        text = Language.FN_RATE;
        break;
      case AppConstants.SINGLE_LINE_MATRIX_CELL:
        const rowLabel = DataStoreCellSelection.multiEpochData.values[0][DataStoreCellSelection.rowIndex].label;
        const colLabel = DataStoreCellSelection.multiEpochData.values[0][DataStoreCellSelection.colIndex].label;
        text = rowLabel + ' ' + Language.PREDICTED_AS + ' ' + colLabel;
        break;
    }
    this.$header.text(text);
  }

  getYLabelText() {
    let text = '';
    const rowLabel = DataStoreCellSelection.labels[DataStoreCellSelection.rowIndex][1];
    switch(DataStoreCellSelection.type) {
      case AppConstants.SINGLE_LINE_MATRIX_CELL:
      case AppConstants.COMBINED_MATRIX_CELL:
        text = Language.CONFUSION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += rowLabel;
        text += ' with ';
        text += DataStoreCellSelection.multiEpochData.values[0][DataStoreCellSelection.colIndex].label;
        break;
      case AppConstants.COMBINED_CHART_CELL_FP:
      case AppConstants.COMBINED_CHART_CELL_FN:
      case AppConstants.MULTI_LINE_CHART_CELL_FN:
      case AppConstants.MULTI_LINE_CHART_CELL_FP:
        text = Language.CONFUSION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += rowLabel;
        break;
      case AppConstants.COMBINED_CHART_CELL_PRECISION:
      case AppConstants.SINGLE_LINE_PRECISION:
        text = Language.PRECISION_Y_LABEL;
        text = text + ' ' + Language.FOR_CLASS + ' ';
        text += rowLabel;
        break;
    }
    return text;
  }

  clear() {
	  if(this.$g !== null) {
		this.$g.remove();
		this.$g = null;
	  }
  }

  render() {
    if(DataStoreCellSelection.multiEpochData === null) {
      return;
    }
    this.createHeaderText();
    const margin = {top: 5, right: 10, bottom: 140, left: 65}; // set left + bottom to show axis and labels
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

    this.renderAxis(y);

    if(DataStoreCellSelection.type === AppConstants.SINGLE_LINE_MATRIX_CELL || DataStoreCellSelection.type === AppConstants.SINGLE_LINE_PRECISION ||
      DataStoreCellSelection.type === AppConstants.COMBINED_MATRIX_CELL || DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_PRECISION) {
      const lineDataOneCell = DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.rowIndex][DataStoreCellSelection.colIndex];
      this.renderSingleLine(lineDataOneCell, x, y, DataStoreCellSelection.singleEpochIndex);
    } else if(DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FP || DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FN) {
      console.assert(DataStoreCellSelection.singleEpochIndex === -1);
      this.renderMultiLine(DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.colIndex], x, y, -1);
    } else if(DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_FP || DataStoreCellSelection.type === AppConstants.COMBINED_CHART_CELL_FN) {
      console.assert(DataStoreCellSelection.singleEpochIndex > -1);
      this.renderMultiLine(DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.colIndex], x, y, DataStoreCellSelection.singleEpochIndex);
    }
  }

  renderAxis(y: any) {
    const values = DataStoreEpoch.multiSelected.map((x) => x.name);
    const x = d3.scale.ordinal()
      .domain(values)
      .rangePoints([0, this.width]);

    //todo these are magic constants: use a more sophisticated algo to solve this
    let tickFrequency = 1;
    if(values.length > 20) {
      tickFrequency = 4;
    }

    const ticks = values.filter((x, i) => i % tickFrequency === 0 );
    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(ticks);

    this.$g.append('g')
      .attr('class', 'chart-axis-x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

    const yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

    this.$g.append('g')
      .attr('class', 'chart-axis-y')
      .call(yAxis);

    const axisDistance = 100;
    // now add titles to the axes
    this.$g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (-axisDistance/2) +','+(this.height/2)+')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
        .text(this.getYLabelText());

    this.$g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (this.width/2) +','+(this.height-(-axisDistance))+')')  // centre below axis
        .text(Language.EPOCH);

	  this.$g.selectAll('.chart-axis-x text')  // select all the text elements for the xaxis
          .attr('transform', function(d) {
             return 'translate(' + this.getBBox().height*-2 + ',' + this.getBBox().height + ')rotate(-45)';
         });
    }

  renderSingleLine(lineDataOneCell: IClassEvolution, x: any, y: any, singleEpochIndex: number) {
    this.$g.classed('linechart', true);
    const line = d3_shape.line()
      .x((d, i) => x(i))
      .y((d) => y(d));

    this.$g.append('path')
      .classed('detail-view-line', true)
      .attr('d', line(lineDataOneCell.values))
      .style('stroke-width', this.STROKE_WIDTH);

    if (singleEpochIndex > -1) {
      addDashedLines(this.$g, x, singleEpochIndex, this.height, this.width);
    }
  }

  renderMultiLine(data: IClassEvolution[], x, y, singleEpochIndex: number) {
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

    if (singleEpochIndex > -1) {
      addDashedLines(this.$g, x, singleEpochIndex, this.height, this.width);
    }
  }

  /*createFocus(x: any, y: any, data: IClassEvolution[]) {
    this.$focus = this.$g.append('g')
        .attr('class', 'focus')
        .style('display', 'none');

    this.$focus.append('line')
        .attr('class', 'x-hover-line hover-line')
        .attr('y1', 0)
        .attr('y2', this.height);

    this.$focus.append('line')
        .attr('class', 'y-hover-line hover-line')
        .attr('x1', this.width)
        .attr('x2', this.width);

    this.$focus.append('circle')
        .attr('r', 7.5);

    this.$focus.append('text')
        .attr('x', 15)
      	.attr('dy', '.31em');

    const that = this;
    this.$svg.on('mouseover', () => { this.$focus.style('display', null); })
        .on('mouseout', () => { this.$focus.style('display', 'none'); })
        .on('mousemove', function() {that.foo(this, x, y, data);});
  }

  foo(ele: HTMLElement, x: any, y: any, data: any) {
    const bisectDate = d3.bisector(function(d) { return d; }).left;
    const x0 = x.invert(d3.mouse(ele)[0]),
    i = bisectDate(data, x0, 1),
    d0 = data[i - 1],
    d1 = data[i],
    d = x0 - d0.year > d1.year - x0 ? d1 : d0;
    this.$focus.attr('transform', 'translate(' + x(d.year) + ',' + y(d.value) + ')');
    this.$focus.select('text').text(function() { return d.value; });
  }*/
}
