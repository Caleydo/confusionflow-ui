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
import {Rangeband} from './Rangeband';

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
    function sortNumber(a: IMalevoEpochInfo, b: IMalevoEpochInfo) {
      return extractEpochId(a) - extractEpochId(b);
    }

    epochs.sort(sortNumber);
    const length = extractEpochId(epochs[epochs.length - 1]);
    for(let i = 0; i <= length; i++) {
      const epoch = epochs.find((x) => extractEpochId(x) === i);
      const dp = epoch ? new DataPoint(true, i, epoch) : new DataPoint(false, i, epoch);
      this.datapoints.push(dp);
    }
  }
}

class DataPoint {
  public canBeRemoved = false;
  public condense = false;
  constructor(public exists: boolean, public position: number, public epoch: IMalevoEpochInfo) {

  }
}

export class Timeline implements IDragSelection {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;
  private rangeSelector: TimelineRangeSelector;
  private rangeBand: Rangeband;
  private readonly MAX_DRAG_TOLERANCE = 10; // defines how many pixels are interpreted as click until it switches to drag
  private readonly rectSelector = '.epoch';
  data:TimelineData = null;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g').classed('timeline', true);
    this.createLabel(datasetName);
  }

  createLabel(datasetName: string) {
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

  createRangeSelector() {
    this.rangeBand = new Rangeband(this.$rectangles);
    this.rangeSelector = new TimelineRangeSelector(this.MAX_DRAG_TOLERANCE, this.$rectangles, this.rectSelector);
    this.rangeSelector.addListener(this);
    this.rangeSelector.addListener(this.rangeBand);
  }

  render(offsetH: number, offsetV: number) {
    this.$node.attr('transform', 'translate(0,' + offsetV + ')');
    // Add a group for each cause.
    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }
    this.$rectangles = this.$node.append('g');

    const $g = this.$rectangles.attr('transform', 'translate(' + offsetH + ',' + 5 + ')')
      .selectAll('g').data(this.data.datapoints.filter((x) => !x.canBeRemoved))
      .enter().append('g').attr('class', 'epoch');

    $g.append('rect')
      .attr('height', (d) => d.condense ? AppConstants.TML_CONDENSED_BAR_HEIGHT : AppConstants.TML_BAR_HEIGHT)
      .attr('width', (d) => d.condense ? AppConstants.TML_CONDENSED_BAR_WIDTH : AppConstants.TML_BAR_WIDTH)
      .classed('hidden', (d) => !d.exists)
      .append('title')
		    .text((d) => d.position);

    $g.each(function () {
      let x = 0;
      if(this.previousSibling) {
        const $g = d3.select(this.previousSibling);
        x += d3.transform($g.attr('transform')).translate[0];
        x += +$g.select('rect').attr('width');
        x += AppConstants.TML_BAR_MARGIN;
      }
      d3.select(this).attr('transform', 'translate(' + x + ',' + 0 + ')');
    });
    this.createRangeSelector();
  }

  dragEnd(sel: d3.Selection<any>) {
    if(sel[0].length > 1) {
      DataStoreEpochSelection.multiSelected = sel.data().map((x) => x.epoch);
    } else if(sel[0].length === 1) {
      const curSelection = DataStoreEpochSelection.singleSelected;
      this.$node.selectAll(this.rectSelector).classed('single-selected', false);
      DataStoreEpochSelection.clearSingleSelection();
      if(sel.data()[0].epoch !== curSelection) { // if sel.data()[0] === curSelection => current node will be deselected
        sel.classed('single-selected', true);
        DataStoreEpochSelection.singleSelected = sel.data()[0].epoch;
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
