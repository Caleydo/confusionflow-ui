import * as events from 'phovea_core/src/event';
import {Line, MatrixHeatCellContent} from './CellContent';
import {ACell, LabelCell, MatrixCell, PanelCell} from './Cell';
import {adaptTextColorToBgColor, extractEpochId} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {Language} from '../language';
import {DataStoreApplicationProperties, DataStoreCellSelection, dataStoreTimelines} from '../DataStore';
import {time} from 'd3';
import {AppConstants} from '../AppConstants';
import {isUndefined} from 'util';

/**
 * Created by Martin on 19.03.2018.
 */

export interface ITransposeRenderer {
  isTransposed: boolean;
}

export abstract class ACellRenderer {
  nextRenderer: ACellRenderer = null;
  setNextRenderer(renderer: ACellRenderer): ACellRenderer {
    this.nextRenderer = renderer;
    return this.nextRenderer;
  }
  renderNext(cell: ACell) {
    this.render(cell);
    if (this.nextRenderer != null) {
      this.nextRenderer.renderNext(cell);
    }
  }
  protected abstract render(cell: ACell);
  public abstract weightFactorChanged();
}

export class LineChartRenderer extends ACellRenderer {
  protected cell: MatrixCell | PanelCell;

  constructor(protected width: number, protected height: number) {
    super();
  }

  protected renderLine(data: Line[], $node: d3.Selection<any>) {
    const x = d3.scale.linear().domain([0, getLargestLine(data).values.length - 1]).rangeRound([0, this.width]);
    const y = d3.scale.pow().exponent(DataStoreApplicationProperties.weightFactor).domain([0, getLargestLine(data).max]).rangeRound([this.height, 0]);

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
      .attr('stroke', (d, _) => d.color)
      .attr('stroke-opacity', '0.6')
      .attr('d', (d) => line(d.values))
      .append('title')
      .text((d) => d.classLabel);

    $node.select('g').selectAll('.instance-line').attr('d', (d) => line(d.values));
  }

  public weightFactorChanged() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, () => {
      this.update();
    });
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

  protected update() {
    const data: Line[] = [].concat.apply([], this.cell.data.linecell);
    this.renderLine(data, this.cell.$node);
  }
}

export class MatrixLineCellRenderer extends LineChartRenderer {
  private $svg: d3.Selection<any>;
  constructor() {
    super(0, 0);
  }

  protected render(cell: MatrixCell | PanelCell) {
    this.cell = cell;
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    this.$svg = cell.$node.append('svg').datum(data);

    this.width = (<any>cell.$node[0][0]).clientWidth;
    this.height = (<any>cell.$node[0][0]).clientHeight;

    this.$svg
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .classed('linechart', true)
      .append('g');

    this.renderLine(data, this.$svg);
  }

  protected update() {
    const data: Line[] = [].concat.apply([], this.cell.data.linecell);
    this.renderLine(data, this.$svg);
  }
}

export class VerticalLineRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    if (cell.data.heatcell === null) {
      return;
    }
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    if (isUndefined(singleEpochIndex) || singleEpochIndex === null) {
      return;
    }
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    // we don't want to render empty cells
    if (data.length === 1 && data[0].values.length === 0) {
      return;
    }
    const $g = cell.$node.select('g');
    const width = this.width > -1 ? this.width : (<any>cell.$node[0][0]).clientWidth;
    const height = this.height > -1 ? this.height : (<any>cell.$node[0][0]).clientHeight;
    const x = d3.scale.linear().rangeRound([0, width]);
    const y = d3.scale.linear().rangeRound([height, 0]);

    x.domain([0, getLargestLine(data).values.length - 1]);
    if (singleEpochIndex > -1) {
      this.addDashedLines($g, x, singleEpochIndex, width, height);
    }
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

  public weightFactorChanged() {}
}

export class SingleEpochMarker extends ACellRenderer implements ITransposeRenderer {
  constructor(public isTransposed = false) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
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
    const res = width / largest;

    const firstHCPart = cell.$node.select('div.heat-cell'); // select first part of heat cell
    let bg = firstHCPart.style('background');
    const position = (this.isTransposed) ? `0px ${res * singleEpochIndex}px` : `${res * singleEpochIndex}px 0px`;
    const size = (this.isTransposed) ? `2px ${res}px ` : `${res}px 2px`;
    const str = `linear-gradient(to right, rgb(0, 0, 0), rgb(0, 0, 0)) ${position} / ${size} no-repeat,`;
    bg = str + bg;
    firstHCPart.style('background', bg);
  }

  public weightFactorChanged() {}
}

export class BarChartRenderer extends ACellRenderer {
  protected render(cell: MatrixCell | PanelCell) {
    cell.$node.text('bar chart here');
  }

  public weightFactorChanged() {}
}

export class LabelCellRenderer extends ACellRenderer {
  protected render(cell: LabelCell) {
    cell.$node
      .classed('label-cell', true)
      .text(cell.labelData.label)
      .style('background-color', 'white');
  }

  public weightFactorChanged() {}
}

export class HeatmapMultiEpochRenderer extends ACellRenderer implements ITransposeRenderer {
  constructor(public isTransposed = false) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    const gradientDirection = (this.isTransposed) ? 'to bottom' : 'to right';

    const $subCells = cell.$node
      .selectAll('div')
      .data(data);

    $subCells.enter().append('div').classed('heat-cell', true);
    $subCells.style('background', (datum: Line) => {
      const colorScale = d3.scale.linear().domain([0, datum.max]).range(<any>['white', datum.color]);
      const widthInPercent = 100 / datum.values.length;
      let res = datum.values.reduce((acc, val, index) => {
        return acc + colorScale(val) + ' ' + (index) * widthInPercent + '%, ' + colorScale(val) + ' ' + (index + 1) * widthInPercent + '%, ';
      }, '');
      res = res.substring(0, res.length - 2);
      return `linear-gradient(${gradientDirection}, ${res})`;
    });
  }

  public weightFactorChanged() {}
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
      .style('background-color', (datum: {count: number, colorValue: string}) => {
        return datum.colorValue;
      })
      .style('color', (datum: {count: number, colorValue: string}) => adaptTextColorToBgColor(datum.colorValue))
      .text((datum: {count: number, colorValue: string}) => this.showNumber ? datum.count : '');
  }

  public weightFactorChanged() {}
}

export class AxisRenderer extends ACellRenderer {
  private data: Line[] = null;
  private yAxis: any;
  private y: any;
  private $g: d3.Selection<any> = null;

  constructor(private width: number, private height: number) {
    super();
    this.yAxis = d3.svg.axis()
      .orient('left');
    this.y = d3.scale.pow();
  }

  public weightFactorChanged() {
    events.on(AppConstants.EVENT_WEIGHT_FACTOR_CHANGED, () => {
      if (this.$g !== null) {
        this.updateYAxis(DataStoreApplicationProperties.weightFactor);
      }
    });
  }

  private updateYAxis(value: number) {
    this.y.exponent(value).domain([0, getLargestLine(this.data).max]).range([this.height, 0]);
    this.yAxis.scale(this.y);
    this.$g.select('.chart-axis-y').call(this.yAxis);
  }

  protected render(cell: MatrixCell | PanelCell) {
    this.$g = cell.$node.select('g');
    if (this.$g === null) {
      return;
    }
    this.data = [].concat.apply([], cell.data.linecell);
    const timelineArray = Array.from(dataStoreTimelines.values());
    const selectedRangesLength = timelineArray.map((x) => x.multiSelected.length);
    const largest = selectedRangesLength.indexOf(Math.max(...selectedRangesLength));
    const values = timelineArray[largest].multiSelected.map((x) => extractEpochId(x).toString());

    const x = d3.scale.ordinal()
      .domain(values)
      .rangePoints([0, this.width]);

    const y = d3.scale.linear()
      .rangeRound([this.height, 0])
      .domain([0, getLargestLine(this.data).max]);

    //todo these are magic constants: use a more sophisticated algo to solve this
    let tickFrequency = 1;
    if (selectedRangesLength[largest] > 20) {
      tickFrequency = 4;
    }

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
      .text(this.getYLabelText());

    this.$g.append('text')
      .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
      .attr('transform', 'translate(' + (this.width / 2) + ',' + (this.height - (-axisDistance)) + ')')  // centre below axis
      .text(Language.EPOCH);
  }

  getYLabelText() {
    let text = '';
    const cell = DataStoreCellSelection.getCell();
    if (cell instanceof MatrixCell) {
      text = Language.CONFUSION_Y_LABEL;
    } else if (cell instanceof PanelCell) {
      if (cell.type === AppConstants.CELL_FP) {
        text = Language.FP_RATE;
      } else if (cell.type === AppConstants.CELL_FN) {
        text = Language.FN_RATE;
      } else if (cell.type === AppConstants.CELL_PRECISION) {
        text = Language.PRECISION;
      }
    }
    return text;
  }
}

function getLargestLine(data: Line[]): Line {
  console.assert(data.length > 0);
  return data.reduce((acc, val) => {
    return (acc.values.length > val.values.length) ? acc : val;
  }, data[0]);
}
