import {Line, MatrixHeatCellContent} from './CellContent';
import {ACell, LabelCell, MatrixCell, PanelCell} from './Cell';
import {adaptTextColorToBgColor} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {Language} from '../language';

/**
 * Created by Martin on 19.03.2018.
 */

const linePatterns = ['1, 1', '5, 5', '10, 10', '20,10,5,5,5,10'];

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
  protected render(cell: MatrixCell | PanelCell) {
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
  protected getValidDataIndex(data: Line[]) {
    let index = 0;
    for(let i = 0; i < data.length; i++) {
      if(data[i].values.length > 0) {
        index = i;
        break;
      }
    }
    return index;
  }

  protected render(cell: MatrixCell | PanelCell) {
    const datasetCount = cell.data.linecell.length;
    const data: Line[] = [].concat.apply([], cell.data.linecell);
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

    // we don't want to render empty cells
    if(data.length === 1 && data[0].values.length === 0) {
      return;
    }

    const index = this.getValidDataIndex(data);
    x.domain([0, data[index].values.length - 1]);
    y.domain([0, data[index].max]);

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
      .attr('stroke-dasharray', (d, i) => linePatterns[Math.floor(i / (data.length / datasetCount))])
      .append('title')
      .text((d) => d.classLabel);
  }
}

export class DetailViewRenderer extends MatrixLineCellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const datasetCount = cell.data.linecell.length;
    const data: Line[] = [].concat.apply([], cell.data.linecell);


    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    const z = d3.scale.category10();

    const index = this.getValidDataIndex(data);
    x.domain([0, data[index].values.length - 1]);
    y.domain([0, data[index].max]);
    //z.domain(data.map((x) => x.classLabel));

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    const $epochLine = cell.$node.select('g').selectAll('path')
      .data(data)
      .enter().append('path')
      .classed('detail-view-line', true)
      .attr('d', (d) => line(d.values))
      .attr('stroke', (d) => z(d.classLabel))
      .attr('stroke-dasharray', (d, i) => linePatterns[Math.floor(i / (data.length / datasetCount))])
      .append('title')
      .text((d) => d.classLabel);
  }

}

export class VerticalLineRenderer extends ACellRenderer {
  protected render(cell: MatrixCell | PanelCell) {
    /*if(cell.data.heatcell === null) {
      return;
    }
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    if(singleEpochIndex === null) { //todo improve so that this is not necessary
      return;
    }
    const $g = cell.$node.select('g');
    const width = (<any>cell.$node[0][0]).clientWidth;
    const height = (<any>cell.$node[0][0]).clientHeight;
    const x = d3.scale.linear().rangeRound([0, width]);
    const y = d3.scale.linear().rangeRound([height, 0]);
    const data: Line[][] = cell.data.linecell;

    if(data.length === 1 && data[0][0].values.length === 0) {
      return;
    }

    // if it is a matrix cell and cell 0 and it is removed (matrix diagonal filtering)
    // use cell 1 for calculation
    if(data[0].values.length === 0) {
      x.domain([0, data[0][1].values.length - 1]);
      y.domain([0, data[0][1].max]);
    } else {
      x.domain([0, data[0][0].values.length - 1]);
      y.domain([0, data[0][0].max]);
    }*/
  }
}

export class BarchartRenderer extends ACellRenderer {
  protected render(cell: MatrixCell | PanelCell) {
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

export class AxisRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const $g = cell.$node.select('g');
    if($g === null) {
      return;
    }
    const values = cell.data.linecell[0].values;
    const x = d3.scale.ordinal()
      .domain(values.map((x) => String(x)))
      .rangePoints([0, this.width]);

    const maxVal = Math.max(...cell.data.linecell.map((x) => Math.max(...x.values)));
    const y = d3.scale.linear()
      .rangeRound([this.height, 0])
      .domain([0, maxVal]);

    //todo these are magic constants: use a more sophisticated algo to solve this
    const tickFrequency = 1;

    const ticks = values.filter((x, i) => i % tickFrequency === 0 );
    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(ticks);

    $g.append('g')
      .attr('class', 'chart-axis-x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(xAxis);

    const yAxis = d3.svg.axis()
      .scale(y)
      .orient('left');

    $g.append('g')
      .attr('class', 'chart-axis-y')
      .call(yAxis);

    const axisDistance = 100;
    // now add titles to the axes
    $g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (-axisDistance/2) +','+(this.height/2)+')rotate(-90)')  // text is drawn off the screen top left, move down and out and rotate
        ;//.text(this.getYLabelText());

    $g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (this.width/2) +','+(this.height-(-axisDistance))+')')  // centre below axis
        .text(Language.EPOCH);

	  $g.selectAll('.chart-axis-x text')  // select all the text elements for the xaxis
          .attr('transform', function(d) {
             return 'translate(' + this.getBBox().height*-2 + ',' + this.getBBox().height + ')rotate(-45)';
         });
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
