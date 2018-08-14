/**
 * Created by Holger Stitz on 26.08.2016.
 */

import 'select2';
import * as data from 'phovea_core/src/data';
import {AppConstants} from './AppConstants';
import {IAppView} from './app';
import {Language} from './language';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import * as d3 from 'd3';
import Format = d3.time.Format;
import {MalevoDataset, IMalevoDatasetCollection, IMalevoEpochInfo, ILoadedMalevoDataset} from './MalevoDataset';
import {ITable} from 'phovea_core/src/table';
import * as $ from 'jquery';
import {DataStoreSelectedRun, dataStoreRuns} from './DataStore';
import {extractEpochId} from './utils';
import * as events from 'phovea_core/src/event';

/**
 * Shows a list of available datasets and lets the user choose one.
 * The selection is broadcasted as event throughout the application.
 */
class DataSetSelector implements IAppView {

  private $node;
  private $select;
  private select2Options = {
    maximumSelectionLength: AppConstants.MAX_DATASET_COUNT,
    placeholder: Language.DATASET
  };

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
    this.attachListeners();
    return this.update(); // return the promise
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_LOADING_COMPLETE, (evt, ds: MalevoDataset) => {
     this.updateLoadingState();
    });
  }

  /**
   * Build the basic DOM elements and binds the change function
   */
  private build() {
    this.$node.html(`
      <select id="dataset-selector" multiple="multiple" style="width:70vw">
      </select> `);

    this.$select = this.$node.select('#dataset-selector');

    const that = this;
    (<any>$(this.$select.node()))
      .select2(this.select2Options)
      .on('select2:open', (evt) => {
        setTimeout(() => {
          that.updateSelectorColors(d3.selectAll('li.select2-results__option[aria-selected="true"]'), (el: HTMLElement) => el.innerText);
        }, 10); // wait until select2 generated the result list
      })
      .on('select2:select', (evt) => {
        const dataset = d3.select(evt.params.data.element).data()[0];
        DataStoreSelectedRun.add(dataset);
        that.updateSelectorColors();
        that.updateLoadingState();
      })
      .on('select2:unselect', (evt) => {
        const dataset = d3.select(evt.params.data.element).data()[0];
        DataStoreSelectedRun.remove(dataset);
        that.updateSelectorColors();
        that.updateLoadingState();
      });
  }

  private updateLoadingState() {
    this.$node.selectAll('li.select2-selection__choice')
      .each(function() {
        const d = d3.select(this);
        const dataset = dataStoreRuns.get(d.attr('title'));
        if(dataset.isLoading) {
          d.style('--blinking-color', dataset.color);
          d.classed('loading', true);
        } else {
          d.classed('loading', false);
        }
      });
  }

  private updateSelectorColors(selection = this.$node.selectAll('li.select2-selection__choice'), attrFunc = (el: HTMLElement) => el.title) {
    selection[0]
      .forEach((d, i) => {
        const timeline = dataStoreRuns.get(attrFunc(d));
        // set background to dataset color with opacity of 0.1
        d3.select(d).style('background-color', timeline.color + '19');
      });
  }

  /**
   * Update the list of datasets and returns a promise
   * @returns {Promise<DataSetSelector>}
   */
  private update() {
    const dataprovider = new DataProvider();
    return dataprovider.load()
      .then((data: IMalevoDatasetCollection) => {
        const resultArray = Object.keys(data).map((index) => data[index]);

        const $options = this.$select.selectAll('option').data(resultArray);

        $options.enter().append('option');

        $options
          .attr('value', (d) => d.name)
          .text((d) =>
            `${d.name}`
          );

        $options.exit().remove();
        this.$node.classed('hidden', false);

        // set initial dataset
        if (Object.keys(data).length > 0) {
          const x = data[Object.keys(data)[0]];
          $('#dataset-selector').select2(this.select2Options).val(x.name).trigger('change');
          DataStoreSelectedRun.add(x);
          this.updateSelectorColors();
          this.updateLoadingState();
        }
        return this;
      });
  }

}

class DataProvider {
  /**
   * Loads the data and retruns a promise
   * @returns {Promise<MalevoDataset[]>}
   */
  load(): Promise<IMalevoDatasetCollection> {
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

    return Promise.all([promMatrix, promTable]).then((results: any) => {
      const dsc: IMalevoDatasetCollection = results[0];
      const tables = results[1];

      for (const key of Object.keys(tables)) {
        dsc[key].classLabels = tables[key];
      }
      return dsc;
    });
  }

  private fillMissingEpochs(dsc: IMalevoDatasetCollection) {
    function sortNumber(a: IMalevoEpochInfo, b: IMalevoEpochInfo) {
      if (a === null && b === null) {
        return null;
      } else if (a === null) {
        return extractEpochId(b);
      } else if (b === null) {
        return extractEpochId(a);
      }
      return extractEpochId(a) - extractEpochId(b);
    }

    Object.values(dsc).forEach((dataset: MalevoDataset) => {
      const epochs = dataset.epochInfos;
      epochs.sort(sortNumber);
      const newEpochs = [];
      const length = epochs[epochs.length - 1].id;
      for (let i = 0; i <= length; i++) {
        const epoch = epochs.find((x) => x.id === i);
        const dp = epoch ? epoch : null;
        newEpochs.push(dp);
      }
      dataset.epochInfos = newEpochs;
    });
  }

  prepareClassLabels(data: ITable[]): { [key: string]: ITable } {
    const labelCollection: { [key: string]: ITable } = {};
    for (const x of data) {
      const parts = this.getDatasetName(x);
      labelCollection[parts[0]] = x;
    }
    return labelCollection;
  }

  prepareEpochData(data: INumericalMatrix[]): IMalevoDatasetCollection {
    const getOrCreateMalevoDataset = (dsc: IMalevoDatasetCollection, datasetName: string) => {
      if (!dsc[datasetName]) {
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
      if (!epochInfo) {
        epochInfo = {name: epochName, confusionInfo: null, id: null};
        epochInfo.id = extractEpochId(epochInfo);
        dataset.epochInfos.push(epochInfo);
        return epochInfo;
      }
      return epochInfo;
    };

    const dsc: IMalevoDatasetCollection = {};

    for (const x of data) {
      try {
        const parts = this.getDatasetName(x);
        const dataset = getOrCreateMalevoDataset(dsc, parts[0]);
        const epochInfo: IMalevoEpochInfo = getOrCreateEpochInfo(dataset, parts[2]);
        epochInfo.confusionInfo = x;
      } catch (e) {
        // handle invalid server response data here
      }

    }
    this.fillMissingEpochs(dsc);
    return dsc;
  }

  getDatasetName(x: INumericalMatrix | ITable) {
    const parts = x.desc.name.split('-');
    if (parts.length < 2 || parts.length > 4) {
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
export function create(parent: Element, options: any) {
  return new DataSetSelector();
}
