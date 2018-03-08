/**
 * Created by Martin on 04.01.2018.
 */

import {MalevoDataset, IMalevoEpochInfo} from './MalevoDataset';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {IDragSelection} from './RangeSelector';
import {TimelineRangeSelector} from './RangeSelector';
import {IAppView} from './app';
import {DataStoreEpochSelection} from './DataStore';
import {extractEpochId} from './utils';

export default class TimelineView implements IAppView {
  private readonly $node:d3.Selection<any>;
  private timelines:Timeline[] = [];
  private width: number;
  private maxLabelWidth = 0;

  constructor(parent: Element) {
    this.width = parent.clientWidth;

    this.$node = d3.select(parent)
      .append('svg')
      .classed('timeline-view', true)
      .attr('width', '100%')
      .attr('height', '0px')
      .attr('viewBox', `0 0 ${this.width} ${0}`);
  }

  private findMaxLabelWidth() {
      this.maxLabelWidth = this.timelines.reduce((acc, val) => {
        return acc > val.getLabelWidth() ? acc : val.getLabelWidth();
      }, this.maxLabelWidth);
  }

  updateSvg() {
      this.$node.attr('viewBox', `0 0 ${this.width} ${(this.timelines.length) * AppConstants.TML_HEIGHT}`);
      this.$node.attr('height', '100%');
  }

  updateTimelines() {
    const labelMargin = 10;
    this.findMaxLabelWidth();
    this.timelines.forEach((x, i) => x.offsetV(i * AppConstants.TML_HEIGHT)); // realign other timelines
    this.timelines.forEach((x) => x.render(this.maxLabelWidth + labelMargin));
  }

  private attachListener() {

    events.on(AppConstants.EVENT_DATA_SET_ADDED, (evt, ds:MalevoDataset) => {

      const ts = new Timeline(ds, this.$node);
      this.timelines.push(ts);

      this.updateSvg();
      this.updateTimelines();
    });

    events.on(AppConstants.EVENT_DATA_SET_REMOVED, (evt, ds:MalevoDataset) => {
      const ts = this.timelines.find((x) => x.dataset === ds);
      console.assert(ts);

      this.timelines = this.timelines.filter((x) => x !== ts); // remove from list

      this.updateSvg();
      this.updateTimelines();

      ts.node().remove();

    });
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<Timeline>}
   */
  init() {
    this.attachListener();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {HeatMap}
 */
export function create(parent:Element, options:any) {
  return new TimelineView(parent);
}

class Timeline {
  private $node: d3.Selection<any> = null;
  private $label: d3.Selection<any> = null;
  private $axisX: d3.Selection<any> = null;
  private $rectangles: d3.Selection<any> = null;

  constructor(public dataset: MalevoDataset, $parent: d3.Selection<any>) {
    this.$node = $parent.append('g');
    this.build();
  }

  build() {
    this.$label = this.$node.append('g')
      .attr('transform', 'translate(0,' + 15 +')')
      .append('text')
      .attr('font-size', AppConstants.TML_DS_LABEL_HEIGHT)
      .text(this.dataset.name);
  }

  getLabelWidth(): number {
    return (<any>this.$label[0][0]).clientWidth;
  }

  node(): d3.Selection<any> {
    return this.$node;
  }

  offsetV(offset: number) {
    this.$node.attr('transform', 'translate(0,' + offset + ')');
  }

  render(labelWidth: number) {
    // Scales
    const x = d3.scale.ordinal().rangeBands([0, AppConstants.TML_BAR_WIDTH * this.dataset.epochInfos.length], 0.1, 0);


    const values = this.dataset.epochInfos.map((x) => String(extractEpochId(x)));
    x.domain(values);

    // Axis variables for the bar chart
    const xAxis = d3.svg.axis().scale(x).tickValues(values).orient('bottom');

    // x axis
    if(this.$axisX) {
      this.$axisX.remove();
      this.$axisX = null;
    }
    this.$axisX = this.$node.append('g')
        .attr('class', 'x axis')
        .style('fill', '#000')
        .attr('transform', 'translate(' + labelWidth + ',' + 15 + ')')
        .call(xAxis);

    // Add a group for each cause.
    if(this.$rectangles) {
      this.$rectangles.remove();
      this.$rectangles = null;
    }
    this.$rectangles = this.$node.append('g');
    this.$rectangles.attr('transform', 'translate(' + labelWidth + ',' + 7 + ')')
      .selectAll('rect')
      .data(values)
      .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', function (d) {
            return x(d);
        })
        .attr('y', function (d) {
            return 0;
        })
        .attr('height', function (d) {
            return AppConstants.TML_BAR_HEIGHT;
        })
        .attr('width', x.rangeBand());
  }
}
