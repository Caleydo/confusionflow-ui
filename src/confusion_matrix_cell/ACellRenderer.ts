import {MatrixHeatCellContent, MatrixLineCellContent} from './CellContent';
import {ACell} from './Cell';
import {adaptTextColorToBgColor} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';

/**
 * Created by Martin on 19.03.2018.
 */

abstract class ACellRenderer {
  nextRenderer: ACellRenderer = null;
  setNextRenderer(renderer: ACellRenderer) {
    this.nextRenderer = renderer;
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
      .text((datum: {count: number, colorValue: string}) => datum.count);
  }
}

export class MatrixLineCellRenderer extends ACellRenderer {
  protected render(cell: ACell) {
    const data: MatrixLineCellContent = cell.data.linecell;
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
    z.domain(data[0].classLabel);

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
      .attr('stroke', (d) => z(d.label))
      .append('title')
      .text((d) => d.label);

  }


}
