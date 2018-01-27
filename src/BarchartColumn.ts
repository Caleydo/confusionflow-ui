/**
 * Created by Martin on 27.01.2018.
 */
import {Barchart} from './Barchart';
import {NumberMatrix} from './DataStructures';
import * as d3 from 'd3';

export class BarchartColumn {
  readonly barcharts: Barchart[] = [];

  constructor(private $node: d3.Selection<any>, private readonly CHART_COUNT, margin: {top, bottom, left, right} = {top:0, bottom:0, left:0, right:0}) {
    for(let i = 0; i < this.CHART_COUNT; i++) {
     // const $div = this.$node.append('div');
     // this.barcharts.push(new Barchart($div, margin));
    }
  }

  render(data: NumberMatrix) {
    const $cells = this.$node
      .selectAll('div')
      .data(data.values);

    $cells
      .enter()
      .append('div')
      .classed('cell', true);

    $cells.each((d, i) => {
        d[i] = 0; // don't show the bars located on the main diagonal
        const bc = new Barchart(d3.select($cells[0][i]), {top: 0, left: 0, bottom: 0, right: 0});
        bc.render(d);
      });

    $cells
      .exit()
      .remove();
  }
}
