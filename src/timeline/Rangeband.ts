import {IDragSelection} from '../RangeSelector';
export class Rangeband implements IDragSelection {

  private $node: d3.Selection<any>;
  constructor($parent: d3.Selection<any>) {
    this.$node = $parent.append('div').classed('selection', true);
  }

  public hide(val: boolean) {
    this.$node.classed('hidden', val);
  }

  dragEnd(sel: d3.Selection<any>) {
    // corner case: if the selection range contains just one node or no node at all => don't show rangeband
    if(sel[0].length === 1 || sel[0].length === 0) {
      this.hide(true);
      return;
    }
    this.snapBand(sel);
  }

  dragStart() {
     // nothing
  }

  dragging(start: [number, number], end: [number, number], maxDragTolerance: number) {
    if(end[0] - start[0] > maxDragTolerance) {
      this.hide(false);
      this.$node.style('left', start[0] + 'px');
      this.$node.style('width', end[0] - start[0] + 'px');
    }
  }

  private snapBand(sel: d3.Selection<any>) {
    console.assert(sel[0].length > 1);
    const first = <HTMLElement>sel[0][0];
    const last = <HTMLElement>sel[0][sel.size() - 1];
    const start = first.offsetLeft;
    const width = (last.offsetLeft - start) + last.offsetWidth;
    this.$node.style('left',start + 'px');
    this.$node.style('width', width + 'px');
  }
}



// WEBPACK FOOTER //
// ./src/timeline/Rangeband.ts
