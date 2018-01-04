/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as data from 'phovea_core/src/data';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
import {ITable} from 'phovea_core/src/table';
import * as d3 from 'd3';
import {hash} from 'phovea_core/src';
import {ProductIDType} from 'phovea_core/src/idtype';
import {parse} from 'phovea_core/src/range';
import Format = d3.time.Format;
import {IMalevoDataset} from './imalevo_dataset';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;

  private trackedSelections: ProductIDType = null;
  private onSelectionChanged = () => this.updateSelectionHash();

  constructor(parent:Element, private options:any) {
    this.$node = d3.select('.navbar-header')
      .append('div')
      .classed('dataSelector', true)
      .append('form')
      .classed('form-inline', true)
      .append('div')
      .classed('form-group', true)
      .classed('hidden', true); // show after loading has finished
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DataSetSelector>}
   */
  init() {
    this.build();
    return this.update(); // return the promise
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    this.$node.append('label')
      .attr('for', 'ds')
      .text(Language.DATA_SET);

    // create select and update hash on property change
    this.$select = this.$node.append('select')
      .attr('id', 'ds')
      .classed('form-control', true)
      .on('change', () => {
        const selectedData = this.$select.selectAll('option')
            .filter((d, i) => i === this.$select.property('selectedIndex'))
            .data();

        if(selectedData.length > 0) {
          events.fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, selectedData[0]);
        }
      });
  }

  /**
   * Toggle tracking of selection of rows/columns/cells for the given dataset
   * @param matrix selected dataset
   */
  private trackSelections(matrix: ITable) {
    if (this.trackedSelections) {
      this.trackedSelections.off(ProductIDType.EVENT_SELECT_PRODUCT, this.onSelectionChanged);
    }
  //  this.trackedSelections = matrix.
  //  this.trackedSelections.on(ProductIDType.EVENT_SELECT_PRODUCT, this.onSelectionChanged);
  }

  /**
   * Update the URL hash based on the selections
   */
  private updateSelectionHash() {
    if (!this.trackedSelections) {
      return;
    }
    const ranges = this.trackedSelections.productSelections();
    const value = ranges.map((r) => r.toString()).join(';');
    hash.setProp(AppConstants.HASH_PROPS.SELECTION, value);
  }



  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data:IMalevoDataset[]) => {
        const $options = this.$select.selectAll('option').data(data);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.name)
          .text((d) => `${d.name}`);

        $options.exit().remove();
        this.$node.classed('hidden', false);
        return this;
      });
  }

}

class DataProvider {

  constructor() {
    //
  }

  /**
   * Loads the data and retruns a promise
   * @returns {Promise<IMalevoDataset[]>}
   */
  load() {
    return data
      //.list((d) => {
      //  return d.desc.type === 'matrix' && (<IMatrixDataDescription<IValueTypeDesc>>d.desc).value.type === VALUE_TYPE_REAL; // return numerical matrices only
      //})
      .list({'type': 'table'}) // use server-side filtering
      .then((list: ITable[]) => {
        const data:IMalevoDataset[] = this.prepareData(list);
        return [].concat(data);
      });
  }

  prepareData(data: ITable[]) {
    return data.map((x) => ({id: 'epoch0', name: x.desc.name}));
  }
}

/**
 * Factory method to create a new DataSetSelector instance
 * @param parent
 * @param options
 * @returns {DataSetSelector}
 */
export function create(parent:Element, options:any) {
  return new DataSetSelector(parent, options);
}
