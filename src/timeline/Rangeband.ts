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
    this.snapBand(sel);
  }

  dragStart() {
     // nothing
  }

  dragging(start: [number, number], end: [number, number], maxDragTolerance: number) {
    if(end[0] - start[0] > maxDragTolerance) {
      this.$node.style('visibility', 'visible');
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
