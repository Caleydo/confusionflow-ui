/**
 * Created by Martin on 29.01.2018.
 */

import {IClassAffiliation, IClassEvolution, SquareMatrix, Matrix, max, NumberMatrix} from './DataStructures';
import {BarChart} from './BarChart';
import {LineChart, MultilineChart} from './LineChart';
import * as d3 from 'd3';
import {adaptTextColorToBgColor} from './utils';
import {AppConstants} from './AppConstants';
import {DataStoreCellSelection} from './DataStore';

export abstract class ACellRenderer {
  abstract renderCells();

  protected attachListener($cells: d3.Selection<any>) {
    const x = 0; // just to get rid of linter error
  }
  abstract clearCells();
}

export class SingleLineChartCellRenderer extends ACellRenderer {

  constructor(private data: Matrix<IClassEvolution>, private filterZeroLines, private singleEpochIndex: number, protected $parent: d3.Selection<any>) {
    super();
  }

  renderCells() {
    const maxVal = max(this.data, (d) => Math.max(...d.values));
    const minVal = 0;
    const r = this.data.to1DArray();

    this.$parent.selectAll('div').remove();
    const $cells = this.$parent.selectAll('div').data(r);

    $cells.enter().append('div')
      .classed('cell', true);
    this.attachListener($cells);
    const that = this;
    $cells.each(function(d) {
       // if we want to filter zero lines and the the line has just 0 values => continue
      if(that.filterZeroLines && !d.values.find((val) => val !== 0)) {
        return;
      }
      new LineChart(d3.select(this)).render(d, maxVal, minVal, that.singleEpochIndex);
    });
  }

  clearCells() {
    this.$parent.selectAll('div').remove();
  }
}

export class MultilineChartCellRenderer extends ACellRenderer {

  constructor(private data: SquareMatrix<IClassEvolution>, private singleEpochIndex: number, private $parent: d3.Selection<any>) {
    super();
  }

  renderCells() {
    const maxVal = max(this.data, (d) => Math.max(...d.values));
    const minVal = 0;
    this.$parent.selectAll('div').remove();
    const $cells = this.$parent.selectAll('div').data(this.data.values);
    $cells.enter().append('div')
      .classed('cell', true);
    this.attachListener($cells);
    const that = this;
    $cells.each(function(d, i) {
      const lineCount = d[0].values.length - 1;
      new MultilineChart(d3.select(this), lineCount).render(d, maxVal, minVal, that.singleEpochIndex);
    });
  }

  clearCells() {
    this.$parent.selectAll('div').remove();
  }
}

export class BarChartCellRenderer extends ACellRenderer {

  constructor(private data: SquareMatrix<IClassAffiliation>, private $parent: d3.Selection<any>) {
      super();
  }

  renderCells() {

    const maxVal = max(this.data, (d) => d.count);
    const minVal = 0;

    const $cells = this.$parent
      .selectAll('div')
      .data(this.data.values, (d) => this.createKey(d));

    // has to be called before enter(), otherwise clientheight = 0
    $cells
      .exit()
      .remove();

    const $enterSelection = $cells
      .enter()
      .append('div')
      .classed('cell', true);
    this.attachListener($enterSelection);

    $enterSelection.each(function(d, i) {
        new BarChart(d3.select(this), {top:0, bottom:0, left:0, right:0}).render(d, minVal, maxVal);
      });
  }

  private createKey(d: IClassAffiliation[]) {
    return d.reduce((acc, cur) => {
      acc += cur.count + cur.label;
      return acc;
    }, '');
  }

  clearCells() {
    this.$parent.selectAll('div').remove();
  }
}

export class LabelCellRenderer extends ACellRenderer {
  constructor(private data: number[], protected $parent: d3.Selection<any>) {
    super();
  }

  renderCells() {
    const $cells = this.$parent
      .selectAll('div')
      .data(this.data);

    $cells
      .enter()
      .append('div')
      .classed('cell', true);

    this.attachListener($cells);

    $cells.text((d) => String(d));

    $cells
      .exit()
      .remove();
  }

  clearCells() {
    this.$parent.selectAll('div').text('0');
  }
}

export class HeatCellRenderer extends ACellRenderer {

  constructor(private data: number[], protected $parent: d3.Selection<any>) {
    super();
  }

  renderCells() {
    const heatmapColorScale = d3.scale.linear()
      .domain([0, Math.max(...this.data)])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    const $cells = this.$parent
      .selectAll('div')
      .data(this.data);

    $cells
      .enter()
      .append('div')
      .classed('cell', true);
    this.attachListener($cells);

    $cells
      .style('background-color', (datum: number) => heatmapColorScale(datum))
      .style('color', (datum: number) => adaptTextColorToBgColor(heatmapColorScale(datum).toString()))
      .text((d) => String(d));

    $cells
      .exit()
      .remove();
  }

  clearCells() {
    this.$parent.selectAll('div').remove();
  }
}

export class ConfusionMatrixHeatCellRenderer extends HeatCellRenderer {
  constructor(private cmdata: NumberMatrix, version1D: number[], private labels: [number, string], $parent: d3.Selection<any>) {
    super(version1D, $parent);
  }

  // todo extract to function
  protected attachListener($cells: d3.Selection<any>) {
    const that = this;
    $cells.on('click', function (d, i) {
      //todo check if we need this renderer
    });
  }
}

export class ConfusionMatrixLineChartCellRenderer extends SingleLineChartCellRenderer {
  constructor(private cmdata: SquareMatrix<IClassEvolution>, filterZeroLines, singleEpochIndex: number, private labels: [number, string],
              $parent: d3.Selection<any>) {
    super(cmdata, filterZeroLines, singleEpochIndex, $parent);
  }

  protected attachListener($cells: d3.Selection<any>) {
    const that = this;
    $cells.on('click', function (d, i) {
      $cells.classed('selected', false);
      d3.select(this).classed('selected', true);

      const predicted = i % that.cmdata.order();
      const groundTruth = Math.floor(i / that.cmdata.order());
      DataStoreCellSelection.lineChartCellSelected(predicted, groundTruth, that.cmdata, that.labels);
    });
  }
}

interface ICombinedType {linedata: IClassEvolution; hmdata: number; }

export class CombinedEpochCellRenderer extends ACellRenderer {
  constructor(private lineData: SquareMatrix<IClassEvolution>, private singleEpochData: SquareMatrix<number>, private filterZeroLines = true,
              private labels: [number, string], private singleEpochIndex: number, private $parent: d3.Selection<any>) {
    super();
  }

  renderCells() {
    const hmData1D = this.singleEpochData.to1DArray();
    const lineData1D = this.lineData.to1DArray();

    console.assert(hmData1D.length === lineData1D.length);

    const maxVal = max(this.lineData, (d) => Math.max(...d.values));
    const minVal = 0;

    const transformedData:ICombinedType[] = hmData1D.map((d, i):ICombinedType => {
      return {'linedata': lineData1D[i], 'hmdata': hmData1D[i]};
    });

    //todo extract to function
    const heatmapColorScale = d3.scale.linear()
      .domain([0, Math.max(...hmData1D)])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    this.$parent
      .selectAll('div')
      .remove();

    const $cells = this.$parent
      .selectAll('div')
      .data(transformedData);

    const $enter = $cells.enter()
      .append('div')
      .classed('cell', true);
    this.attachListener($cells);

    const that = this;
    $cells
      .style('background-color', (datum: ICombinedType, index: number) => heatmapColorScale(datum.hmdata))
      .each(function(datum) {
       // if we want to filter zero lines and the the line has just 0 values => continue
      if(that.filterZeroLines && !datum.linedata.values.find((val) => val !== 0)) {
        return;
      }
      new LineChart(d3.select(this)).render(datum.linedata, maxVal, minVal, that.singleEpochIndex);
    });
  }

  clearCells() {
    this.$parent.selectAll('div').remove();
  }

  protected attachListener($cells: d3.Selection<any>) {
    const that = this;
    $cells.on('click', function (d, i) {
      $cells.classed('selected', false);
      d3.select(this).classed('selected', true);

      const predicted = i % that.singleEpochData.order();
      const groundTruth = Math.floor(i / that.singleEpochData.order());
      DataStoreCellSelection.combinedEpochCellSelected(predicted, groundTruth, that.lineData, that.singleEpochData, that.labels);
    });
  }
}
