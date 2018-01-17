/**
 * Created by Martin on 15.01.2018.
 */
import * as d3 from 'd3';

export default class TimelineRangeSelector {
  private dragStart: [number, number] = null;
  constructor($node: d3.Selection<any>) {
    const that = this;
    const drag = d3.behavior.drag()
      .on('drag', function(d,i) {
        if(!that.dragStart) {
          that.dragStart = d3.mouse(this);
        }
      });

    $node.on('mouseup', function(d, i) {
      if(!that.dragStart) {
        return;
      }
      let dragEnd = d3.mouse(this);
      let dragStart = that.dragStart;
      if(dragStart[0] > dragEnd[0]) {
        const x = dragStart;
        dragStart = dragEnd;
        dragEnd = x;
      }
      const candidates  = that.getSelectionCandidates(dragStart, dragEnd, $node);
      // set selection class for each candidate and call listeners
      that.dragStart = null;
    });
    $node.call(drag);
  }

  private getSelectionCandidates(dragStart: [number, number], dragEnd: [number, number], $node: d3.Selection<any>) {
    const isInRange = function($circle: HTMLElement, startPx: number, endPx: number): boolean {
      const leftBounds = $circle.offsetLeft;
      const rightBounds = $circle.offsetLeft + 20;
      return startPx <= leftBounds && endPx >= rightBounds;
    };
    const $circles = $node.selectAll('.epoch-circle');
    const res = $circles.filter(function(d, i) {
      return isInRange(this, dragStart[0], dragEnd[0]);
    });
    console.log(res);
  }
}
