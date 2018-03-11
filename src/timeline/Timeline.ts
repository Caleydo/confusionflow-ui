/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from '../MalevoDataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from '../AppConstants';
import {DataStoreEpochSelection} from '../DataStore';
import {extractEpochId} from '../utils';
import {IDragSelection, TimelineRangeSelector} from '../RangeSelector';

export class NodeWrapper {
  public canBeRemoved = false;
  public condense = false;
  constructor(public name, public dps: DataPoint[]) {

  }
}

export class OverallTimeline {
  public dataPoints: NodeWrapper[] = [];

  shrinkTimelines() {
    let visibleNodeCounter = 0;
    for(const dp of this.dataPoints) {
      this.removeEmpty(dp);
      if(dp.canBeRemoved) {
        continue;
      }
      this.consdenseNodes(dp, visibleNodeCounter);
      visibleNodeCounter++;
    }
  }

  removeEmpty(epochsAti: NodeWrapper) {
    const existingEpochs = epochsAti.dps.filter((x) => x && x.exists);
    let val = false;
    if(existingEpochs.length === 0) {
      val = true;
    }
    epochsAti.canBeRemoved = val;
    epochsAti.dps.map((x) => x.canBeRemoved = val);
  }

  consdenseNodes(epochsAti: NodeWrapper, visibleNodeCounter: number) {
    let val = false;
    if(visibleNodeCounter % AppConstants.TML_NODE_DENSITY_DISTANCE !== 0) {
      val = true;
    }
    epochsAti.condense = val;
    epochsAti.dps.map((x) => x.condense = val);
  }
}

export class TimelineData {
  constructor(public epochs: IMalevoEpochInfo[]) {
    this.build(epochs);
  }
  datapoints: DataPoint[] = [];

  build(epochs: IMalevoEpochInfo[]) {
    function sortNumber(a,b) {
      return a - b;
    }
    const ids = epochs.map((x) => extractEpochId(x));
    ids.sort(sortNumber);
    for(let i = 0; i <= ids[ids.length - 1]; i++) {
      const dp = ids.includes(i) ? new DataPoint(true, i) : new DataPoint(false, i);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  public canBeRemoved = false;
  public condense = false;
  constructor(public exists: boolean, public position: number) {

  }
}

export class Timeline implements IDragSelection {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $axisX: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;
  private rangeSelector: TimelineRangeSelector;
  private readonly MAX_DRAG_TOLERANCE = 10; // defines how many pixels are interpreted as click until it switches to drag

  data:TimelineData = null;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g');
    this.build(datasetName);
    this.rangeSelector.addListener(this);
  }

  build(datasetName: string) {
    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + 15 +')')
      .append('text')
      .attr('font-size', AppConstants.TML_DS_LABEL_HEIGHT)
      .text(datasetName);
  }

  getDSLabelWidth(): number {
    return (<any>this.$label[0][0]).getBBox().width;
  }

  node(): d3.Selection<any> {
    return this.$node;
  }

  render(offsetH: number, offsetV: number) {
    this.$node.attr('transform', 'translate(0,' + offsetV + ')');
    // Add a group for each cause.
    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }
    this.$rectangles = this.$node.append('g');
    this.rangeSelector = new TimelineRangeSelector(this.MAX_DRAG_TOLERANCE, this.$rectangles, 'rect.epoch');
    this.$rectangles.attr('transform', 'translate(' + offsetH + ',' + 7 + ')')
      .selectAll('rect')
      .data(this.data.datapoints.filter((x) => !x.canBeRemoved))
      .enter().append('rect')
        .attr('class', 'epoch')
        .attr('y', 0)
        .attr('height', AppConstants.TML_BAR_HEIGHT)
        .attr('width', (d) => d.condense ? AppConstants.TML_CONDENSED_BAR_WIDTH : AppConstants.TML_BAR_WIDTH)
        .classed('hidden', (d) => !d.exists)
      .each(function () {
        let x = 0;
        if(this.previousSibling) {
          x = +this.previousSibling.getAttribute('x') + +this.previousSibling.getAttribute('width');
          x += AppConstants.TML_BAR_MARGIN;
        }
        this.setAttribute('x', x);
      });
  }

  dragEnd(sel: d3.Selection<any>) {
    if(sel[0].length > 1) {
      DataStoreEpochSelection.multiSelected = sel.data();
    } else if(sel[0].length === 1) {
      const curSelection = DataStoreEpochSelection.singleSelected;
      this.$node.selectAll('rect.epoch').classed('single-selected', false);
      DataStoreEpochSelection.clearSingleSelection();
      if(sel.data()[0] !== curSelection) { // if sel.data()[0] === curSelection => current node will be deselected
        sel.classed('single-selected', true);
        DataStoreEpochSelection.singleSelected = sel.data()[0];
      }
    }
    events.fire(AppConstants.EVENT_EPOCH_SELECTED);
  }

  dragStart() {
     // nothing
  }

  dragging(start: [number, number], end: [number, number], maxDragTolerance: number) {
    console.assert(start[0] <= end[0]);
    if(end[0] - start[0] > maxDragTolerance) {
      DataStoreEpochSelection.clearMultiSelection(); // we start a new multi selection here so the old one is obsolete
    }
  }
}
