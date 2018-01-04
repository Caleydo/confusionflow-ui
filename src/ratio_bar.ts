import {IMalevoDataset} from './imalevo_dataset';
import * as ajax from 'phovea_core/src/ajax';
import * as d3 from 'd3';

export default class RatioBar {

  private $node:d3.Selection<any>;

  private getJSONEpochMetadata(data: IMalevoDataset) {
    return ajax.getAPIJSON(`/malevo/epoch/${data.id}`);
  }

  constructor(private parent: d3.Selection<any>, malevoData: IMalevoDataset) {
    this.$node = parent
      .append('div')
      .classed('bar_chart', true);
  }

  update() {
    const data = [[4, 5, 6, 7], [8, 5, 3, 9]];
    const $bars = this.$node.selectAll('div.bars')
      .data(data);

    $bars.enter().append('div')
      .classed('bars', true)
      .classed('loading', true)
      .style('width', 16 + 'px')
      .style('height', 100 + 'px');

    $bars.style('left', (d, i) => i * 10);

    $bars.exit().remove();
  }

}
