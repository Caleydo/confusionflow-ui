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
  private brush: d3.svg.Brush<any>;

  constructor(public datasetName: string, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g')
      .classed('timeline', true);
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

  render(offsetH: number, offsetV: number, otl: OverallTimeline) {
    this.$node.attr('transform', 'translate(0,' + offsetV + ')');

    const width = otl.dataPoints.length * 5;
    const x = d3.scale.ordinal().rangePoints([0, width]);
    x.domain(otl.dataPoints.map(function (d) {
        return String(d.name);
    }));

    const xAxis = d3.svg.axis()
      .scale(x)
      .tickValues(x.domain().filter((d, i) => {
        const cond = i < this.data.datapoints.length && this.data.datapoints[i].exists;
        return cond;
      }))
      .orient('bottom')
      .tickSize(-7);

    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }

    this.$rectangles = this.$node.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(${offsetH}, 15)`)
      .call(xAxis);

    // Draw the brush
    this.brush = d3.svg.brush()
        .x(<any>x)
        .on('brush', this.brushmove)
        .on('brushend', this.brushend);

    const brushg = this.$node.append('g')
      .attr('class', 'brush')
      .call(this.brush);

    brushg.selectAll('rect')
        .attr('height', 15);
  }

  brushmove() {
    console.log('moving brush');
   /* y.domain(x.range()).range(x.domain());
    b = this.brush.extent();

    var localBrushYearStart = (this.brush.empty()) ? brushYearStart : Math.ceil(y(b[0])),
        localBrushYearEnd = (this.brush.empty()) ? brushYearEnd : Math.ceil(y(b[1]));

    // Snap to rect edge
    d3.select('g.brush').call((this.brush.empty()) ? this.brush.clear() : this.brush.extent([y.invert(localBrushYearStart), y.invert(localBrushYearEnd)]));

    // Fade all years in the histogram not within the brush
    d3.selectAll('rect.bar').style('opacity', function(d, i) {
      return d.x >= localBrushYearStart && d.x < localBrushYearEnd || brush.empty() ? '1' : '.4';
    });*/
  }

  brushend() {
    console.log('finishing brush');

   /* const localBrushYearStart = (brush.empty()) ? brushYearStart : Math.ceil(y(b[0])),
        localBrushYearEnd = (brush.empty()) ? brushYearEnd : Math.floor(y(b[1]));

      d3.selectAll('rect.bar').style('opacity', function(d, i) {
        return d.x >= localBrushYearStart && d.x <= localBrushYearEnd || brush.empty() ? '1' : '.4';
      });

    // Additional calculations happen here...
    // filterPoints();
    // colorPoints();
    // styleOpacity();

    // Update start and end years in upper right-hand corner of the map
    d3.select('#brushYears').text(localBrushYearStart == localBrushYearEnd ? localBrushYearStart : localBrushYearStart + ' - ' + localBrushYearEnd);
*/
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
