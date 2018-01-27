/**
 * Created by Martin on 27.01.2018.
 */
import {Barchart} from './Barchart';

export class BarchartColumn {
  readonly barcharts: Barchart[] = [];
  readonly CHART_COUNT = 10;

  constructor(private $node: d3.Selection<any>, margin: {top, bottom, left, right} = {top:0, bottom:0, left:0, right:0}) {
    for(let i = 0; i < this.CHART_COUNT; i++) {
      const $div = this.$node.append('div');
      this.barcharts.push(new Barchart($div, margin));
    }
  }

  render(data: number[][]) {
    data.unshift([0, 0]); // add dummy data for label
    const $cells = this.$node
      .selectAll('div')
      .data(data);

    $cells
      .enter()
      .append('div');

    $cells.each((d, i) => {
        if(i === 0) {
          return;
        }
        d[i-1] = 0;
        this.barcharts[i-1].render(d);
      });

    $cells
      .exit()
      .remove();
  }
}
