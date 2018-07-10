/**
 * Created by Martin on 09.07.2018.
 */
import {IAppView} from '../app';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import {AppConstants} from '../AppConstants';
import {PanelCell} from '../confusion_matrix_cell/Cell';
import {applyRendererChain, IMatrixRendererChain} from '../confusion_matrix_cell/ACellRenderer';

export default class ConfusionMeasuresView implements IAppView {
  private $node: d3.Selection<any>;

  constructor(parent: Element) {
    this.$node = d3.select(parent).append('table').classed('metrics-table-content', true);
    /*this.$node.html(`
     <colgroup>
     <col span="2" style="background-color:red">
     <col style="background-color:yellow">
     </colgroup>
     <tr>
     <th>ISBN</th>
     <th>Title</th>
     <th>Price</th>
     </tr>
     <tr>
     <td>3476896</td>
     <td>My first HTML</td>
     <td>$53</td>
     </tr>
     <tr>
     <td>5869207</td>
     <td>My first CSS</td>
     <td>$49</td>
     </tr>
     `);*/
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

  private attachListener() {
    events.on(AppConstants.EVENT_CONF_MEASURE_COLUMN_ADDED, (evt, panelCells: PanelCell[], name: string, renderer: IMatrixRendererChain) => {
      this.updateTable(panelCells, name, renderer);
    });

    events.on(AppConstants.CLEAR_DETAIL_VIEW, () => {
      this.$node.html('');
    });
  }

  private updateTable(panelCells: PanelCell[], name: string, renderer: IMatrixRendererChain) {
    if (this.$node.selectAll('tr').size() === 0) {
      this.$node.append('tr'); // for header row
      panelCells.forEach((cell) => {
        this.$node.append('tr');
      });
    }

    this.$node
      .selectAll('tr')
      .each(function (_, index) {
        if(index === 0) {
          d3.select(this)
            .append('th')
            .text(name);
          return;
        }
        const $div = d3.select(this)
          .append('td');
        const cell = panelCells[index-1];
        cell.init($div);
        applyRendererChain(renderer, cell, renderer.diagonal);
        cell.render();
      });


  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMeasuresView}
 */
export function create(parent: Element, options: any) {
  return new ConfusionMeasuresView(parent);
}
