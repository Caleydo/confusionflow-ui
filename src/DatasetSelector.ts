/**
 * Created by Holger Stitz on 26.08.2016.
 */

import * as data from 'phovea_core/src/data';
import * as events from 'phovea_core/src/event';
import {AppConstants} from './AppConstants';
import {IAppView} from './app';
import {Language} from './language';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import Format = d3.time.Format;
import {MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo} from './MalevoDataset';
import {ITable} from 'phovea_core/src/table';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;

  constructor() {
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
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data:IMalevoDatasetCollection) => {
        const resultArray = Object.keys(data).map((index) => data[index]);

        const $options = this.$select.selectAll('option').data(resultArray);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d)
          .text((d) =>
            `${d.name}`
          );

        $options.exit().remove();
        if(Object.keys(data).length > 0) {
          events.fire(AppConstants.EVENT_DATA_COLLECTION_SELECTED, data[Object.keys(data)[0]]);
        }
        this.$node.classed('hidden', false);
        return this;
      });
  }

}

class DataProvider {
  /**
   * Loads the data and retruns a promise
   * @returns {Promise<MalevoDataset[]>}
   */
  load():Promise<IMalevoDatasetCollection> {
      const promMatrix = data
        .list({'type': 'matrix'}) // use server-side filtering
        .then((list: INumericalMatrix[]) => {
          return this.prepareEpochData(list);
        });
      const promTable = data
        .list({'type': 'table'})
        .then((list: ITable[]) => {
          return this.prepareClassLabels(list);
        });

    return Promise.all([promMatrix, promTable]).then((results:any) => {
      const dsc:IMalevoDatasetCollection = results[0];
      const tables = results[1];

      for(const key of Object.keys(tables)) {
        dsc[key].classLabels = tables[key];
      }
      return dsc;
    });
  }

  prepareClassLabels(data: ITable[]): {[key: string]: ITable} {
    const labelCollection:{[key: string]: ITable} = {};
    for(const x of data) {
      const parts = this.getDatasetName(x);
      labelCollection[parts[0]] = x;
    }
    return labelCollection;
  }

  prepareEpochData(data: INumericalMatrix[]): IMalevoDatasetCollection {


    const getOrCreateMalevoDataset = (dsc: IMalevoDatasetCollection, datasetName: string) => {
      if(!dsc[datasetName]) {
        const ds = new MalevoDataset();
        ds.name = datasetName;
        ds.epochInfos = [];
        dsc[datasetName] = ds;
        return ds;
      }
      return dsc[datasetName];
    };

    const getOrCreateEpochInfo = (dataset: MalevoDataset, epochName: string) => {
      let epochInfo = dataset.epochInfos.find((x) => x.name === epochName);
      if(!epochInfo) {
        epochInfo = {name: epochName, confusionInfo: null};
        dataset.epochInfos.push(epochInfo);
        return epochInfo;
      }
      return epochInfo;
    };

    const dsc: IMalevoDatasetCollection = {};

    for(const x of data) {
      try {
        const parts = this.getDatasetName(x);
        const dataset = getOrCreateMalevoDataset(dsc, parts[0]);
        const epochInfo: IMalevoEpochInfo = getOrCreateEpochInfo(dataset, parts[2]);
        epochInfo.confusionInfo = x;
      } catch(e) {

      }

    }
    return dsc;
  }

  getDatasetName(x: INumericalMatrix | ITable) {
    const parts = x.desc.name.split('-');
    if(parts.length < 2 || parts.length > 4) {
      throw new Error('The received filename is not valid');
    }
    return parts;
  }
}

/**
 * Factory method to create a new DataSetSelector instance
 * @param parent
 * @param options
 * @returns {DataSetSelector}
 */
export function create(parent:Element, options:any) {
  return new DataSetSelector();
}
