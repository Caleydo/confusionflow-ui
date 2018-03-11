/**
 * Created by Martin on 15.01.2018.
 */
import * as d3 from 'd3';

export interface IDragSelection {
  dragEnd(sel: d3.Selection<any>);
  dragStart();
  dragging(start, end, maxDragTolerance);
}

class SelectionRect {
  private startPt: [number, number];
  private endPt: [number, number];

  init(point: [number, number]) {
    this.startPt = point;
  }

  end(point: [number, number]) {
    this.endPt = point;
  }

  getOrderByX() {
    let startPt = this.startPt, endPt = this.endPt;
    if(this.startPt[0] > this.endPt[0]) {
      endPt = this.startPt;
      startPt = this.endPt;
    }
    return [startPt, endPt];
  }
}

export class TimelineRangeSelector {
  selectionRect: SelectionRect;
  private listeners: IDragSelection[] = [];
  private readonly ELEMENT_WIDTH = 25; // adapt in _timeline.scss if necessary
  private readonly OFFSET = 10; // Offset from the left border
  private candidates: d3.Selection<any>;

  constructor(private readonly MAX_DRAG_TOLERANCE, private $node: d3.Selection<any>, private selector: string) {
    this.setup($node);
    this.resetSelectionRect();
  }

  resetSelectionRect() {
    this.selectionRect = new SelectionRect();
  }

  addListener(l: IDragSelection) {
    this.listeners.push(l);
  }

  updateCandidateList(candidates: d3.Selection<any>) {
    this.candidates = candidates;
  }

  private getSelectionCandidates(dragStart: [number, number], dragEnd: [number, number], $candidates: d3.Selection<any>) {
    const isInRange = (element: HTMLElement, startPx: number, endPx: number): boolean => {
      //todo calculate bounds outside and pass them here
      const leftBounds = +element.getAttribute('x');
      const rightBounds = +element.getAttribute('x') + +element.getAttribute('width');
      return startPx <= rightBounds && endPx >= leftBounds;
    };
    const res = $candidates.filter(function(d, i) {
      return isInRange(this, dragStart[0], dragEnd[0]);
    });
    return res;
  }

  private setup($node: d3.Selection<any>) {
    const that = this;
      const dragBehavior = d3.behavior.drag()
        .on('drag', function() {that.dragMove(this);})
        .on('dragstart', function() {that.dragStart(this);})
        .on('dragend', function() {that.dragEnd(this);});

      $node.call(dragBehavior);
  }

  private dragStart(ele: HTMLElement) {
    this.listeners.forEach((l) => l.dragStart());
    const p = d3.mouse(ele);
    this.selectionRect.init(p);
  }

  private dragMove(ele: HTMLElement) {
    const p = d3.mouse(ele);
    this.selectionRect.end(p);
    const range = this.selectionRect.getOrderByX();
    this.listeners.forEach((l) => l.dragging(range[0], range[1], this.MAX_DRAG_TOLERANCE));
  }

  private dragEnd(ele: HTMLElement) {
    this.selectionRect.end(d3.mouse(ele));
    const range = this.selectionRect.getOrderByX();
    const candidates = this.getCandidates();
    if(!candidates) { return; }
    const selection = this.getSelectionCandidates(range[0], range[1], candidates);
    this.listeners.forEach((l) => l.dragEnd(selection));
  }

  private getCandidates() {
    return this.$node.selectAll(this.selector);
  }

}

