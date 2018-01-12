/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as data from 'phovea_core/src/data';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './app_constants';
import {IAppView} from './app';
import {Language} from './language';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import {hash} from 'phovea_core/src';
import {ProductIDType} from 'phovea_core/src/idtype';
import {parse} from 'phovea_core/src/range';
import Format = d3.time.Format;
import {IMalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './malevo_dataset';

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
  private trackSelections(matrix: INumericalMatrix) {
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
      .then((data:IMalevoDatasetCollection) => {
        const resultArray = Object.keys(data).map(function(index){
          return data[index];
        });

        const $options = this.$select.selectAll('option').data(resultArray);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d)
          .text((d) =>
            `${d.name}`
          );

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
      .list({'type': 'matrix'}) // use server-side filtering
      .then((list: INumericalMatrix[]) => {
        return this.prepareData(list);
      });
  }

  prepareData(data: INumericalMatrix[]) {
    const getDatasetName = function(x: INumericalMatrix) {
      const parts = x.desc.name.split('-');
      if(parts.length < 2 || parts.length > 3) {
        throw new Error('The received filename is not valid');
      }
      return parts;
    };

    const getOrCreateMalevoDataset = function(dsc: IMalevoDatasetCollection, datasetName: string) {
      if(!dsc[datasetName]) {
        const ds = new IMalevoDataset();
        ds.name = datasetName;
        ds.epochInfos = new Array();
        dsc[datasetName] = ds;
        return ds;
      }
      return dsc[datasetName];
    };

    const getOrCreateEpochInfo = function(dataset: IMalevoDataset, epochName: string) {
      let epochInfo = dataset.epochInfos.find((x) => x.name === epochName);
      if(!epochInfo) {
        epochInfo = {name: epochName, epochInfo: null, confusionInfo: null};
        dataset.epochInfos.push(epochInfo);
        return epochInfo;
      }
      return epochInfo;
    };

    const dsc: IMalevoDatasetCollection = {};

    for(const x of data) {
      const parts = getDatasetName(x);
      const dataset = getOrCreateMalevoDataset(dsc, parts[0]);
      const epochInfo: IMalevoEpochInfo = getOrCreateEpochInfo(dataset, parts[1]);
      if(parts.length === 2) {
        epochInfo.epochInfo = x;
      } else {
        epochInfo.confusionInfo = x;
      }
      const epochname = parts[0];

    }
    return dsc;
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
