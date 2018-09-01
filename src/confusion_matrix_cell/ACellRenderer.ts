import * as events from 'phovea_core/src/event';
import {Line, MatrixHeatCellContent} from './CellContent';
import {ACell, DetailChartCell, LabelCell, MatrixCell, PanelCell} from './Cell';
import {adaptTextColorToBgColor, extractEpochId} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {Language} from '../language';
import {DataStoreApplicationProperties, DataStoreCellSelection, dataStoreRuns} from '../DataStore';
import {time} from 'd3';
import {AppConstants} from '../AppConstants';
import {isUndefined} from 'util';

/**
 * Created by Martin on 19.03.2018.
 */

export interface ITransposeRenderer {
  isTransposed: boolean;
}

export interface IRendererConfig {
  renderer: string;
  params: any[];
}

export interface IMatrixRendererChain {
  offdiagonal: IRendererConfig[];
  diagonal: IRendererConfig[]; // also used for 1 dimensional vectors, aka. columns and rows
  functors: { (renderer: ACellRenderer): void; }[];
}

/**
 * Represents an abstract cell renderer that renders the conf matrix cells
 * Uses the decorator pattern to chain renderers
 */
export abstract class ACellRenderer {
  nextRenderer: ACellRenderer = null;

  /**
   * Sets the next renderer in the chain
   * @param renderer
   * @returns {ACellRenderer}
   */
  setNextRenderer(renderer: ACellRenderer): ACellRenderer {
    this.nextRenderer = renderer;
    return this.nextRenderer;
  }

  /**
   * Renders the next renderer in the chain
   * @param cell
   */
  renderNext(cell: ACell) {
    this.render(cell);
    if (this.nextRenderer != null) {
      this.nextRenderer.renderNext(cell);
    }
  }

  protected abstract render(cell: ACell);

  /**
   * Adds listeners to the renderers
   */
  public abstract addWeightFactorChangedListener();

  public abstract removeWeightFactorChangedListener();

  public abstract addYAxisScaleChangedListener();

  public abstract removeYAxisScaleChangedListener();
}

export class LineChartRenderer extends ACellRenderer {
  protected cell: MatrixCell | PanelCell;

  private update = () => {
    const data: Line[] = [].concat.apply([], this.cell.data.linecell);
    this.renderLine(data, this.cell.$node);
  }

  constructor(protected width: number, protected height: number) {
    super();
  }

  protected renderLine(data: Line[], $node: d3.Selection<any>) {
    const x = d3.scale.linear().domain([0, getLargestLine(data).values.length - 1]).rangeRound([0, this.width]);
    const y = d3.scale.pow().exponent(DataStoreApplicationProperties.weightFactor).domain([0, getYMax(this.cell, data)]).rangeRound([this.height, 0]);

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    $node.select('g').selectAll('path')
      .data(data)
      .enter().append('path')
      .classed('instance-line', true)
      .attr('stroke', (d) => d.color)
      .attr('stroke-opacity', '0.6')
      .append('title')
      .text((d) => d.classLabel);

    $node.select('g').selectAll('.instance-line').attr('d', (d) => line(DataStoreApplicationProperties.switchToAbsolute ? d.values : d.valuesInPercent));
  }

  public addWeightFactorChangedListener() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public removeWeightFactorChangedListener() {
    events.off(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public addYAxisScaleChangedListener() {
    events.on(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  public removeYAxisScaleChangedListener() {
    events.off(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  protected render(cell: MatrixCell | PanelCell) {
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    // we don't want to render empty cells
    if (data.length === 1 && data[0].values.length === 0) {
      return;
    }

    this.cell = cell;
    this.renderLine(data, this.cell.$node);
  }
}

export class MatrixLineCellRenderer extends LineChartRenderer {
  private $svg: d3.Selection<any>;

  constructor() {
    super(0, 0);
  }

  // TODO: fix reflow issues
  protected render(cell: MatrixCell | PanelCell) {
    this.cell = cell;
    const data: Line[] = [].concat.apply([], cell.data.linecell);

    // not sure whether this helps
    const node = <any>cell.$node.node();
    this.width = node.clientWidth;
    this.height = node.clientHeight;

    this.$svg = cell.$node.append('svg')
      .datum(data);

    this.$svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('linechart', true)
      .append('g');

    this.renderLine(data, this.$svg);
  }


}

export class VerticalLineRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  // TODO: fix reflow issues
  protected render(cell: MatrixCell | PanelCell) {
    if (cell.data.heatcell === null) {
      return;
    }
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    if (isUndefined(singleEpochIndex) || singleEpochIndex === null) {
      return;
    }
    const node = (<any>cell.$node[0][0]);
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    // we don't want to render empty cells
    if (data.length === 1 && data[0].values.length === 0) {
      return;
    }

    // TODO: refactor SingleEpochMarker functionality out
    /*
    const width = this.width > -1 ? this.width : node.clientWidth;
    const height = this.height > -1 ? this.height : node.clientHeight;
    const x = d3.scale.linear().rangeRound([0, width]);
    // not used
    //const y = d3.scale.linear().rangeRound([height, 0]);

    x.domain([0, getLargestLine(data).values.length - 1]);

    const $g = cell.$node.select('g');

    if (singleEpochIndex > -1) {
      this.addDashedLines($g, x, singleEpochIndex, width, height);
    }
    */
  }

  private addDashedLines($g: d3.Selection<any>, x: any, singleEpochIndex: number, width: number, height: number) {
    const $line = $g.append('line').attr('y1', 0).attr('y2', height);
    $line.classed('dashed-lines', true);
    $line.attr('x1', x(singleEpochIndex) + this.borderOffset($line, x(singleEpochIndex), width)).attr('x2', x(singleEpochIndex) + this.borderOffset($line, x(singleEpochIndex), width));
  }

  private borderOffset($line: d3.Selection<any>, posX: number, width: number) {
    let sw = parseInt($line.style('stroke-width'), 10);
    sw /= 2;
    if (posX === 0) {
      return sw;
    } else if (posX === width) {
      return -sw;
    }
    return 0;
  }

  public addWeightFactorChangedListener() {
  }

  public removeWeightFactorChangedListener() {
  }

  public addYAxisScaleChangedListener() {
  }

  public removeYAxisScaleChangedListener() {
  }
}

export class SingleEpochMarker extends ACellRenderer implements ITransposeRenderer {
  protected cell: MatrixCell | PanelCell;

  constructor(public isTransposed = false) {
    super();
  }

  private update = () => {
    this.render(this.cell);
  }

  protected render(cell: MatrixCell | PanelCell) {
    this.cell = cell;
    if (cell.data.heatcell === null) {
      return;
    }
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    if (isUndefined(singleEpochIndex) || singleEpochIndex === null) {
      return;
    }
    const width = (<any>cell.$node[0][0]).clientWidth;

    const data: Line[] = [].concat.apply([], cell.data.linecell);
    const largest = getLargestLine(data).values.length;
    let res = width / largest;

    const firstHCPart = d3.select(cell.$node.selectAll('div.heat-cell')[0][0]); // select first part of heat cell
    let bg = firstHCPart.style('background');
    let position = null;
    const markerMinSize = 1;
    // when marker is smaller 1 and last epoch is selected, shift marker to the left
    if (res < markerMinSize && largest - markerMinSize === singleEpochIndex) {
      position = res * largest - markerMinSize;
    } else {
      position = res * singleEpochIndex;
    }
    position = (this.isTransposed) ? `0px ${position}px` : `${position}px 0px`;
    res = res < markerMinSize ? markerMinSize : res;
    const size = (this.isTransposed) ? `2px ${res}px ` : `${res}px 2px`;
    const str = `linear-gradient(to right, rgb(0, 0, 0), rgb(0, 0, 0)) ${position} / ${size} no-repeat,`;
    bg = str + bg;
    firstHCPart.style('background', bg);
  }

  public addWeightFactorChangedListener() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public removeWeightFactorChangedListener() {
    events.off(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public addYAxisScaleChangedListener() {
    events.on(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  public removeYAxisScaleChangedListener() {
    events.off(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }
}

export class BarChartRenderer extends ACellRenderer {

  constructor(protected width: number, protected height: number, protected $g: d3.Selection<any>) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    if (cell.data.heatcell === null) {
      return;
    }
    const data = cell.data.heatcell;
    const width = this.width === -1 ? (<any>cell.$node.node()).clientWidth : this.width;
    const height = this.height === -1 ? (<any>cell.$node.node()).clientHeight : this.height;

    //const x = d3.scale.ordinal().rangeRoundBands([0, width], 0.1);
    const xScaleRange = data.counts.length * ((width / 2) / AppConstants.MAX_DATASET_COUNT);
    const x = d3.scale.ordinal()
      .rangeRoundBands([width / 2 - xScaleRange, width / 2 + xScaleRange], 0.2);

    const y = d3.scale.linear().rangeRound([height, 0]);


    x.domain(data.counts.map(function (d, i) {
      return i.toString();
    }));
    y.domain([0, d3.max(data.counts, function (d) {
      return d;
    })]);

    if (this.$g === null) {
      const $svg = cell.$node.append('svg');
      $svg
        .attr('viewBox', `0 0 ${width} ${height}`);

      this.$g = $svg.append("g")
        .attr("transform", "translate(" + 0 + "," + 0 + ")");
    }

    this.$g.selectAll(".bar")
      .data(data.counts)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function (d, i) {
        return x(i.toString());
      })
      .attr("y", function (d) {
        return y(d);
      })
      .attr("width", x.rangeBand())
      .attr("height", function (d) {
        return height - y(d);
      })
      .style('fill', (d, i) => data.colorValues[i]);
  }

  private update = () => {

  }

  public addWeightFactorChangedListener() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public removeWeightFactorChangedListener() {
    events.off(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public addYAxisScaleChangedListener() {
    events.on(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  public removeYAxisScaleChangedListener() {
    events.off(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }
}

export class LabelCellRenderer extends ACellRenderer {
  protected render(cell: LabelCell) {
    cell.$node
      .classed('label-cell', true)
      .text(cell.labelData.label);
  }

  public addWeightFactorChangedListener() {
  }

  public removeWeightFactorChangedListener() {
  }

  public addYAxisScaleChangedListener() {
  }

  public removeYAxisScaleChangedListener() {
  }
}

export class HeatmapMultiEpochRenderer extends ACellRenderer implements ITransposeRenderer {
  protected cell: MatrixCell | PanelCell;

  constructor(public isTransposed = false) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    this.cell = cell;
    const data: Line[] = [].concat.apply([], cell.data.linecell);

    const $subCells = cell.$node
      .selectAll('div')
      .data(data);

    $subCells.enter().append('div').classed('heat-cell', true);
    this.update();
  }

  private getColorScale(datum: Line) {
    return d3.scale.pow().exponent(DataStoreApplicationProperties.weightFactor).domain([0, DataStoreApplicationProperties.switchToAbsolute ? datum.max : 1]).range(<any>['white', datum.color]);
  }

  private update = () => {
    const gradientDirection = (this.isTransposed) ? 'to bottom' : 'to right';
    const $subCells = this.cell.$node.selectAll('.heat-cell');
    $subCells.style('background', (datum: Line) => {
      const colorScale = this.getColorScale(datum);
      const widthInPercent = 100 / datum.values.length;
      const values = DataStoreApplicationProperties.switchToAbsolute ? datum.values : datum.valuesInPercent;
      let res = values.reduce((acc, val, index) => {
        return acc + colorScale(val) + ' ' + (index) * widthInPercent + '%, ' + colorScale(val) + ' ' + (index + 1) * widthInPercent + '%, ';
      }, '');
      res = res.substring(0, res.length - 2);
      return `linear-gradient(${gradientDirection}, ${res})`;
    });
  }

  public addWeightFactorChangedListener() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public removeWeightFactorChangedListener() {
    events.off(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public addYAxisScaleChangedListener() {
    events.on(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  public removeYAxisScaleChangedListener() {
    events.off(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }
}

export class HeatmapSingleEpochRenderer extends ACellRenderer {
  constructor(private showNumber: boolean, private renderGrayscale) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const $subCells = cell.$node
      .selectAll('div')
      .data((x: MatrixHeatCellContent, index: number) => {
        const hc = cell.data.heatcell;
        return hc.counts.map((x, i) => {
          const colorDomain = d3.scale.linear().domain([0, hc.maxVal]);
          const colorScale = this.renderGrayscale ? colorDomain.range(<any>AppConstants.BG_COLOR_SCALE).interpolate(<any>d3.interpolateHcl) :
            colorDomain.range(<any>['white', hc.colorValues[i]]);
          return {count: hc.counts[i], colorValue: String(colorScale(hc.counts[i]))};
        });
      });

    $subCells.enter().append('div').classed('heat-cell', true)
      .style('background-color', (datum: { count: number, colorValue: string }) => {
        return datum.colorValue;
      })
      .style('color', (datum: { count: number, colorValue: string }) => adaptTextColorToBgColor(datum.colorValue))
      .text((datum: { count: number, colorValue: string }) => this.showNumber ? datum.count : '');
  }

  public addWeightFactorChangedListener() {
  }

  public removeWeightFactorChangedListener() {
  }

  public addYAxisScaleChangedListener() {
  }

  public removeYAxisScaleChangedListener() {
  }
}

export class AxisRenderer extends ACellRenderer {
  private data: Line[] = null;
  private yAxis: any;
  private y: any;
  private $g: d3.Selection<any> = null;
  private cell: MatrixCell | PanelCell;

  private update = () => {
    if (this.$g !== null) {
      this.updateYAxis(DataStoreApplicationProperties.weightFactor);
    }
  }

  constructor(private width: number, private height: number) {
    super();
    this.yAxis = d3.svg.axis()
      .orient('left');
    this.y = d3.scale.pow();
  }

  public addWeightFactorChangedListener() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public removeWeightFactorChangedListener() {
    events.off(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, this.update);
  }

  public addYAxisScaleChangedListener() {
    events.on(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  public removeYAxisScaleChangedListener() {
    events.off(AppConstants.EVENT_SWITCH_SCALE_TO_ABSOLUTE, this.update);
  }

  private updateYAxis(value: number) {
    this.y.exponent(value).domain([0, getYMax(this.cell, this.data)]).range([this.height, 0]);
    this.yAxis.scale(this.y);
    this.$g.select('.chart-axis-y').call(this.yAxis);
  }

  protected render(cell: MatrixCell | PanelCell) {
    this.$g = cell.$node.select('g');
    this.cell = cell;
    if (this.$g === null) {
      return;
    }
    this.data = [].concat.apply([], cell.data.linecell);
    const timelineArray = Array.from(dataStoreRuns.values());
    const selectedRangesLength = timelineArray.map((x) => x.multiSelected.length);
    const largest = selectedRangesLength.indexOf(Math.max(...selectedRangesLength));
    const values = timelineArray[largest].multiSelected.filter((x) => x !== null).map((x) => extractEpochId(x).toString());

    const x = d3.scale.ordinal()
      .domain(values)
      .rangePoints([0, this.width]);

    const y = d3.scale.linear()
      .rangeRound([this.height, 0])
      .domain([0, getYMax(cell, this.data)]);

    //todo these are magic constants: use a more sophisticated algo to solve this
    const labelWidth = 25; // in pixel
    const numTicks = this.width / labelWidth;
    const tickFrequency = Math.ceil(values.length / numTicks);

    const ticks = values.filter((x, i) => i % tickFrequency === 0);
    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(ticks);

    this.$g.append('g')
      .attr('class', 'chart-axis-x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

    this.updateYAxis(DataStoreApplicationProperties.weightFactor);

    this.$g.append('g')
      .attr('class', 'chart-axis-y')
      .call(this.yAxis);

    const axisDistance = 100;
    // now add titles to the axes
    this.$g.append('text')
      .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr('transform', 'translate(' + (-axisDistance / 2) + ',' + (this.height / 2) + ')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
      .text(getYLabelText());

    this.$g.append('text')
      .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr('transform', 'translate(' + (this.width / 2) + ',' + (this.height - (-axisDistance / 2)) + ')')  // centre below axis
      .text(Language.EPOCH);
  }
}

export class BarAxisRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const $g = cell.$node.select('g');
    const data = cell.data.heatcell;

    const xScaleRange = data.counts.length * ((this.width / 2) / AppConstants.MAX_DATASET_COUNT);
    const x = d3.scale.ordinal()
      .rangeRoundBands([0, this.width], 0.2);

    const y = d3.scale.linear().rangeRound([this.height, 0]).domain([0, Math.max(...data.counts)]);

    const xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

    const yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

    $g.append("g")
      .attr("class", "chart-axis-x")
      .attr("transform", "translate(0," + this.height + ")")
      .call(xAxis);

    $g.append("g")
      .attr("class", "chart-axis-y")
      .call(yAxis);

    const axisDistance = 100;

    // now add titles to the axes
    $g.append('text')
      .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr('transform', 'translate(' + (-axisDistance / 2) + ',' + (this.height / 2) + ')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
      .text(getYLabelText());

    $g.append('text')
      .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr('transform', 'translate(' + (this.width / 2) + ',' + (this.height - (-axisDistance / 3)) + ')')  // centre below axis
      .text(Language.RUNS);
  }

  public addWeightFactorChangedListener() {
  }

  public removeWeightFactorChangedListener() {
  }

  public addYAxisScaleChangedListener() {
  }

  public removeYAxisScaleChangedListener() {
  }
}

function getLargestLine(data: Line[]): Line {
  console.assert(data.length > 0);
  return data.reduce((acc, val) => {
    return (acc.values.length > val.values.length) ? acc : val;
  }, data[0]);
}

export function applyRendererChain(rendererProto: IMatrixRendererChain, cell: ACell, target: IRendererConfig[]) {
  let firstRenderer = null;
  target.reduce((acc: ACellRenderer, val: IRendererConfig) => {
    const copy = rendererFactory(val);
    rendererProto.functors.forEach((f) => f(copy));
    if (acc === null) {
      firstRenderer = copy;
      return copy;
    }
    acc.setNextRenderer(copy);
    return copy;
  }, null);
  cell.renderer = firstRenderer;
}

function rendererFactory(proto: IRendererConfig) {
  switch (proto.renderer) {
    case 'HeatmapMultiEpochRenderer': // TODO Use constants
      return new HeatmapMultiEpochRenderer(proto.params[0]);
    case 'HeatmapSingleEpochRenderer':
      return new HeatmapSingleEpochRenderer(proto.params[0], proto.params[1]);
    case 'SingleEpochMarker':
      return new SingleEpochMarker(proto.params[0]);
    case 'LineChartRenderer':
      return new LineChartRenderer(proto.params[0], proto.params[1]);
    case 'AxisRenderer':
      return new AxisRenderer(proto.params[0], proto.params[1]);
    case 'BarAxisRenderer':
      return new BarAxisRenderer(proto.params[0], proto.params[1]);
    case 'VerticalLineRenderer':
      return new VerticalLineRenderer(proto.params[0], proto.params[1]);
    case 'LabelCellRenderer':
      return new LabelCellRenderer();
    case 'MatrixLineCellRenderer':
      return new MatrixLineCellRenderer();
    case 'BarChartRenderer':
      return new BarChartRenderer(proto.params[0], proto.params[1], proto.params[2]);
    default:
      return null;
  }
}

export function createCellRenderers($cells: d3.Selection<any>, renderProto: IMatrixRendererChain) {
  $cells.each((datum, index) => {
    const target = index % (AppConstants.CONF_MATRIX_SIZE + 1) !== 0 ? renderProto.offdiagonal : renderProto.diagonal;
    applyRendererChain(renderProto, datum, target);
  });
}

export function removeListeners(renderChain: ACellRenderer, funct: ((r: ACellRenderer) => any)[]) {
  let curRenderer = renderChain;
  while (curRenderer !== null) {
    funct.forEach((f) => f(curRenderer));
    curRenderer = curRenderer.nextRenderer;
  }
}

function getYMax(cell: ACell, data: Line[]) {
  const maxScale = 1;

  // cell types with no absolute values always have a max value of 1
  if (cell instanceof DetailChartCell && cell.child instanceof PanelCell && cell.child.hasType([AppConstants.CELL_PRECISION, AppConstants.CELL_RECALL, AppConstants.CELL_F1_SCORE])) {
    return maxScale;
  }
  return DataStoreApplicationProperties.switchToAbsolute ? getLargestLine(data).max : maxScale;
}

function getYLabelText() {
    let text = '';
    const cell = DataStoreCellSelection.getCell();
    if (cell instanceof MatrixCell) {
      const scaleType = DataStoreApplicationProperties.switchToAbsolute ? Language.NUMBER : Language.PERCENT;
      text = scaleType + ' ' + Language.CONFUSION_Y_LABEL;
    } else if (cell instanceof PanelCell) {
      if (cell.type === AppConstants.CELL_FP) {
        text = Language.FP_RATE;
      } else if (cell.type === AppConstants.CELL_FN) {
        text = Language.FN_RATE;
      } else if (cell.type === AppConstants.CELL_PRECISION) {
        text = Language.PRECISION;
      } else if (cell.type === AppConstants.CELL_RECALL) {
        text = Language.RECALL;
      } else if (cell.type === AppConstants.CELL_F1_SCORE) {
        text = Language.F1_SCORE;
      } else if(cell.type === AppConstants.CELL_CLASS_SIZE) {
        text = Language.CLASS_SIZE;
      }
    }
    return text;
  }

