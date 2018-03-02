import {ADetailViewTab} from './ADetailViewTab';
import {DataStoreCellSelection, DataStoreEpoch} from '../DataStore';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {IClassEvolution, max} from '../DataStructures';
import {Language} from '../language';

export class DetailChartTab extends ADetailViewTab {
  private width: number;
  private height: number;
  private $g: d3.Selection<any> = null;
  private $svg: d3.Selection<any> = null;
  private $header: d3.Selection<any> = null;
  private readonly STROKE_WIDTH = 3;

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

  clear() {
	  if(this.$g !== null) {
		this.$g.remove();
		this.$g = null;
	  }
  }

  render() {
    console.assert(DataStoreCellSelection.multiEpochData !== null);
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

    // combined cells will be handled like single line cells
    if(DataStoreCellSelection.type === AppConstants.SINGLE_LINE_MATRIX_CELL || DataStoreCellSelection.type === AppConstants.SINGLE_LINE_PRECISION ||
      DataStoreCellSelection.type === AppConstants.COMBINED_MATRIX_CELL) {
      const lineDataOneCell = DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.rowIndex][DataStoreCellSelection.colIndex];
      this.renderSingleLine(lineDataOneCell, x, y);
    } else if(DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FP || DataStoreCellSelection.type === AppConstants.MULTI_LINE_CHART_CELL_FN) {
      this.renderMultiLine(DataStoreCellSelection.multiEpochData.values[DataStoreCellSelection.colIndex], x, y);
    }
  }

  renderAxis(y) {
    const values = DataStoreEpoch.multiSelected.map((x) => x.name);
    const x = d3.scale.ordinal()
      .domain(values)
      .rangePoints([0, this.width]);

	//todo these are magic constants: use a more sophisticated algo to solve this
	let tickFrequency = 1;
	if(values.length > 20) {
		tickFrequency = 4;
	}

	const ticks = values.filter((x, i) => i % tickFrequency == 0 );
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
        .text(Language.VALUE);

    this.$g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (this.width/2) +','+(this.height-(-axisDistance))+')')  // centre below axis
        .text(Language.EPOCH);

	  this.$g.selectAll('.chart-axis-x text')  // select all the text elements for the xaxis
          .attr('transform', function(d) {
             return 'translate(' + this.getBBox().height*-2 + ',' + this.getBBox().height + ')rotate(-45)';
         });
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
