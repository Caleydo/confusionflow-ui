import {IDragSelection} from '../RangeSelector';
import * as d3 from 'd3';

export class Rangeband implements IDragSelection {
  private $node: d3.Selection<any>;
  private readonly MARGINH: number = 3;
  private isDragging = false;

  constructor($parent: d3.Selection<any>) {
    this.$node = $parent.append('rect')
      .attr('fill-opacity', '0.5')
      .attr('rx', '4')
      .attr('ry', '4')
      .classed('selection', true);
  }

  hide(val: boolean) {
    this.$node.classed('hidden', val);
  }

  dragEnd(sel: d3.Selection<any>) {
    if(sel[0].length > 1) {
      this.snapBand(sel);
    }

    // corner case: if the selection range contains just one node or no node at all => don't show rangeband
    if(this.isDragging && sel[0].length === 1 || sel[0].length === 0) {
      this.hide(true);
    }
    this.isDragging = false;
  }

  dragStart() {
     // nothing
  }

  dragging(start: [number, number], end: [number, number], maxDragTolerance: number) {
    if(end[0] - start[0] > maxDragTolerance) {
      this.hide(false);
      this.$node.attr('x', start[0] + 'px');
      this.$node.attr('width', end[0] - start[0] + this.MARGINH + 'px');
      this.isDragging = true;
    }
  }

  private snapBand(sel: d3.Selection<any>) {
    console.assert(sel[0].length > 1);
    const $first = d3.select(<HTMLElement>sel[0][0]);
    const $last = d3.select(<HTMLElement>sel[0][sel.size() - 1]);
    const leftBounds = d3.transform($first.attr('transform')).translate[0];
    const rightBounds = d3.transform($last.attr('transform')).translate[0] + +$last.select('rect').attr('width');
    const width = rightBounds - leftBounds;
    this.$node.attr('x',leftBounds  - this.MARGINH + 'px');
    this.$node.attr('width', width + 2*this.MARGINH + 'px');
  }
}



// WEBPACK FOOTER //
// ./src/timeline/Rangeband.ts
