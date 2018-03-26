import {Line, MatrixHeatCellContent} from './CellContent';
import {ACell, LabelCell, MatrixCell, PanelCell} from './Cell';
import {adaptTextColorToBgColor} from '../utils';
import * as d3 from 'd3';
import * as d3_shape from 'd3-shape';
import {Language} from '../language';
import {DataStoreCellSelection, dataStoreTimelines} from '../DataStore';
import {time} from 'd3';
import {AppConstants} from '../AppConstants';

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

    x.domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).values.length - 1]);
    y.domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).max]);

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
      .attr('stroke', (_, i) => z(String(Math.floor(i / (data.length / datasetCount)))))
      .attr('stroke-opacity', '0.6')
      .append('title')
      .text((d) => d.classLabel);
  }
}

export class DetailViewRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    const datasetCount = cell.data.linecell.length;
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    // we don't want to render empty cells
    if(data.length === 1 && data[0].values.length === 0) {
      return;
    }

    const x = d3.scale.linear().rangeRound([0, this.width]);
    const y = d3.scale.linear().rangeRound([this.height, 0]);
    const z = d3.scale.category10();

    x.domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).values.length - 1]);
    y.domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).max]);

    const line = d3_shape.line()
      .x((d, i) => {
        return x(i);
      })
      .y((d) => {
        return y(d);
      });

    cell.$node.select('g').selectAll('path')
      .data(data)
      .enter().append('path')
      .classed('detail-view-line', true)
      .attr('d', (d) => line(d.values))
      .attr('stroke', (_, i) => z(String(Math.floor(i / (data.length / datasetCount)))))
      .attr('stroke-opacity', '0.6')
      .append('title')
      .text((d) => d.classLabel);
  }
}

export class VerticalLineRenderer extends ACellRenderer {
  constructor(private width: number, private height: number) {
    super();
  }

  protected render(cell: MatrixCell | PanelCell) {
    if(cell.data.heatcell === null) {
      return;
    }
    const singleEpochIndex = cell.data.heatcell.indexInMultiSelection[0]; // select first single epoch index
    if(!singleEpochIndex) { //todo improve so that this is not necessary
      return;
    }
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    // we don't want to render empty cells
    if(data.length === 1 && data[0].values.length === 0) {
      return;
    }
    const $g = cell.$node.select('g');
    const width = this.width > -1 ? this.width : (<any>cell.$node[0][0]).clientWidth;
    const height = this.height > -1 ? this.height : (<any>cell.$node[0][0]).clientHeight;
    const x = d3.scale.linear().rangeRound([0, width]);
    const y = d3.scale.linear().rangeRound([height, 0]);

    x.domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).values.length - 1]);
    if(singleEpochIndex > -1) {
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
    if(posX === 0) {
      return sw;
    } else if(posX === width) {
      return -sw;
    }
    return 0;
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
      .text(cell.labelData.label)
      .style('background-color', 'white');
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
    const data: Line[] = [].concat.apply([], cell.data.linecell);
    const timelineArray = Array.from(dataStoreTimelines.values());
    const selectedRangesLength = timelineArray.map((x) => x.multiSelected.length);
    const largest = selectedRangesLength.indexOf(Math.max(...selectedRangesLength));
    const values = timelineArray[largest].multiSelected.map((x) => x.name);

    const x = d3.scale.ordinal()
      .domain(values)
      .rangePoints([0, this.width]);

    const y = d3.scale.linear()
      .rangeRound([this.height, 0])
      .domain([0, getLargest(data, ((x: Line, y: Line) => x.values.length > y.values.length)).max]);

    //todo these are magic constants: use a more sophisticated algo to solve this
    let tickFrequency = 1;
    if(selectedRangesLength[largest] > 20) {
      tickFrequency = 4;
    }

    const ticks = values.filter((x, i) => i % tickFrequency === 0);
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
        .text(this.getYLabelText());

    $g.append('text')
        .attr('text-anchor', 'middle')  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr('transform', 'translate('+ (this.width/2) +','+(this.height-(-axisDistance))+')')  // centre below axis
        .text(Language.EPOCH);

	  $g.selectAll('.chart-axis-x text')  // select all the text elements for the xaxis
          .attr('transform', function(d) {
             return 'translate(' + this.getBBox().height*-2 + ',' + this.getBBox().height + ')rotate(-45)';
         });
  }

  getYLabelText() {
    let text = '';
    if(DataStoreCellSelection.cell instanceof MatrixCell) {
      text = Language.CONFUSION_Y_LABEL;
    } else if(DataStoreCellSelection.cell instanceof PanelCell) {
       if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_FP) {
         text = Language.FP_RATE;
       } else if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_FN) {
         text = Language.FN_RATE;
       } else if(DataStoreCellSelection.cell.type ===  AppConstants.CELL_PRECISION) {
         text = Language.PRECISION;
       }
    }
    return text;
  }
}

function getLargest(data: Line[], func: ((x: Line, y: Line) => boolean)): Line {
  console.assert(data.length > 0);
  const res = data.reduce((acc, val) => {
    return func(acc, val) ? acc : val;
  }, data[0]);
  return res;
}