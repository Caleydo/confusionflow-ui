import {Line, MatrixHeatCellContent} from './CellContent';
import {ACell, LabelCell} from './Cell';
import {adaptTextColorToBgColor} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';

/**
 * Created by Martin on 19.03.2018.
 */

export abstract class ACellRenderer {
  nextRenderer: ACellRenderer = null;
  setNextRenderer(renderer: ACellRenderer): ACellRenderer {
    this.nextRenderer = renderer;
    return this.nextRenderer;
  }
  renderNext(cell: ACell) {
    this.render(cell);
    if(this.nextRenderer != null) {
      this.nextRenderer.renderNext(cell);
    }
  }
  protected abstract render(cell: ACell);
}

export class HeatCellRenderer extends ACellRenderer {
  constructor(private showNumber: boolean) {
    super();
  }
  protected render(cell: ACell) {
     const $subCells = cell.$node
       .selectAll('div')
       .data((x: MatrixHeatCellContent, index: number) => {
        const hc = cell.data.heatcell;
        return hc.counts.map((x, i) => {
          return {count: hc.counts[i], colorValue:hc.colorValues[i]};
        });
     });

    $subCells.enter().append('div').classed('heat-cell', true)
      .style('background-color', (datum: {count: number, colorValue: string}) => {
        return datum.colorValue;
      })
      .style('color', (datum: {count: number, colorValue: string}) => adaptTextColorToBgColor(datum.colorValue))
      .text((datum: {count: number, colorValue: string}) => this.showNumber ? datum.count : '');
  }
}

export class MatrixLineCellRenderer extends ACellRenderer {
  protected render(cell: ACell) {
    const data: Line[] = cell.data.linecell;
    const $svg = cell.$node.append('svg').datum(data);

    const width = (<any>cell.$node[0][0]).clientWidth;
    const height = (<any>cell.$node[0][0]).clientHeight;

    const $g = $svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .classed('linechart', true)
      .append('g');

    const x = d3.scale.linear().rangeRound([0, width]);
    const y = d3.scale.linear().rangeRound([height, 0]);
    const z = d3.scale.category10();

    x.domain([0, data[0].values.length - 1]);
    y.domain([0, data[0].max]);
    z.domain(data.map((x) => x.classLabel));

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const $epochLine = $g.selectAll('path')
      .data(data)
      .enter().append('path')
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.classLabel))
      .append('title')
      .text((d) => d.classLabel);
  }
}

export class VerticalLineRenderer extends ACellRenderer {
  protected render(cell: ACell) {
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    const $g = cell.$node.select('g');
    const width = (<any>cell.$node[0][0]).clientWidth;
    const height = (<any>cell.$node[0][0]).clientHeight;
    const x = d3.scale.linear().rangeRound([0, width]);
    const y = d3.scale.linear().rangeRound([height, 0]);
    const data: Line[] = cell.data.linecell;
    x.domain([0, data[0].values.length - 1]);
    y.domain([0, data[0].max]);
    if(singleEpochIndex > -1) {
      addDashedLines($g, x, singleEpochIndex, width, height);
    }
  }
}

export class BarchartRenderer extends ACellRenderer {
  protected render(cell: ACell) {
    cell.$node.text('barchart here');
  }
}

export class LabelCellRenderer extends ACellRenderer {
  protected render(cell: LabelCell) {
    cell.$node
      .classed('label-cell', true)
      .text(cell.labelData.label);
  }
}

function addDashedLines($g: d3.Selection<any>, x: any, singleEpochIndex: number, width: number, height: number) {
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
