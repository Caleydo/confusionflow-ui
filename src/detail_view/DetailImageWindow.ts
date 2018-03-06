import {ADetailWindow} from './ADetailWindow';
import {DataStoreCellSelection, DataStoreEpoch} from '../DataStore';
import {getAPIData, getAPIJSON} from '../../../phovea_core/src/ajax';
import {AppConstants} from '../AppConstants';
import {Language} from '../language';
import {extractEpochId} from '../utils';
import {DetailChartWindow} from './DetailChartWindow';

export class DetailImageWindow extends ADetailWindow {
  public id: string = AppConstants.IMAGE_VIEW;
  public name: string = Language.IMAGE_VIEW;

  constructor(protected parent: Element) {
    super(parent);
  }

  init(): Promise<DetailImageWindow> {
    this.$node.attr('id', this.id);
    return Promise.resolve(this);
  }

  render() {
    const predicted: number = DataStoreCellSelection.colIndex;
    const groundTruth: number = DataStoreCellSelection.rowIndex;
    const labels = DataStoreCellSelection.labels;

    this.$node.html(`
      <p class="title"></p>
      <div class="images"><div class="loading">Loading images...</div></div>
    `);
    this.$node.select('.title')
        .html(`<strong>${labels[groundTruth][1]}</strong> ${Language.PREDICTED_AS} <strong>${labels[predicted][1]}</strong>`);

    const runId = DataStoreEpoch.selectedDataset.name;
    const epochId = extractEpochId(DataStoreEpoch.singleSelected);

    getAPIJSON(`/malevo/confmat/cell/imageIds?runId=${runId}&epochId=${epochId}&groundTruthId=${groundTruth}&predictedId=${predicted}`)
      .then((data: number[]) => {
        const imageIds = data.join(',');
        return getAPIData(`/malevo/images/imageSprite?imageIds=${imageIds}`, {}, 'blob');
      })
      .then((imageSprite) => {
        this.$node.select('.images .loading').classed('hidden', true);
        const imageUrl = window.URL.createObjectURL(imageSprite);
        this.$node.select('.images').append('img').attr('src', imageUrl);
      });
  }

  clear() {
    this.$node.select('.images img').remove();
    this.$node.select('.images .loading').classed('hidden', false);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {DetailChartWindow}
 */
export function create(parent:Element, options:any) {
  return new DetailImageWindow(parent);
}
