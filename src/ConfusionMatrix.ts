export default class ConfusionMatrix {
  private readonly $parent: d3.Selection<any>;


  constructor($root: d3.Selection<any>) {
    this.$parent = $root.classed('confusion_matrix', true);
    // this.create();
  }

  /* private create() {

   }*/

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
