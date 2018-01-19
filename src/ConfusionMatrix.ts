import {IAppView} from './app';
import * as d3 from 'd3';
export default class ConfusionMatrix implements IAppView{
  private readonly $node: d3.Selection<any>;


  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('confusion_matrix', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<ConfusionMatrix>}
   */
  init() {
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  render(data: any) {

    const margin = {top: 120, right: 20, bottom: 20, left: 110};
    const width = 750 - margin.right - margin.left;
    const height = 300 - margin.top - margin.bottom;

    /* let svg = this.$parent.append('svg')
     .attr('width', width + margin.left + margin.right)
     .attr('height', height + margin.top + margin.bottom)
     .append('g')
     .attr('transform', `translate(${margin.left},${margin.top})`);

     svg.selectAll('rect')
     .data(data)
     .enter().append('g').append('rect')
     .attr('class', 'cell')
     .attr('width', cellSize)
     .attr('height', cellSize)
     .attr('y', function(d) { return yScale(d.country); })
     .attr('x', function(d) { return xScale(d.product); })
     .attr('fill', function(d) { return colorScale(d.value); });

     svg.append('g')
     .attr('class', 'y axis')
     .call(yAxis)
     .selectAll('text')
     .attr('font-weight', 'normal');

     svg.append('g')
     .attr("class", "x axis")
     .call(xAxis)
     .selectAll('text')
     .attr('font-weight', 'normal')
     .style("text-anchor", "start")
     .attr("dx", ".8em")
     .attr("dy", ".5em")
     .attr("transform", function (d) {
     return "rotate(-65)";
     });
     }
     */
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent:Element, options:any) {
  return new ConfusionMatrix(parent);
}
