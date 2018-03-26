import {ADetailViewTab} from './ADetailViewTab';
import {
  DataStoreCellSelection, dataStoreTimelines
} from '../DataStore';
import {getAPIData, getAPIJSON} from 'phovea_core/src/ajax';
import {AppConstants} from '../AppConstants';
import {Language} from '../language';
import {MatrixCell} from '../confusion_matrix_cell/Cell';

export class DetailImageTab extends ADetailViewTab {
  public id: string = AppConstants.IMAGE_VIEW;
  public name: string = Language.IMAGE_VIEW;

  constructor(protected parent: Element) {
    super(parent);
  }

  init(): Promise<DetailImageTab> {
    this.$node.attr('id', this.id);
    return Promise.resolve(this);
  }

  render() {
    if(!DataStoreCellSelection.cell || !(DataStoreCellSelection.cell instanceof MatrixCell)) {
      return;
    }
    const cell = DataStoreCellSelection.cell;
    if(!cell.data.heatcell) {
      return;
    }

    this.$node.html(`
      <p class="title"></p>
      <div class="images"><div class="loading">Loading images...</div></div>
    `);
    this.$node.select('.title')
        .html(`<strong>${cell.groundTruthLabel}</strong> ${Language.PREDICTED_AS} <strong>${cell.predictedLabel}</strong>`);

    dataStoreTimelines.forEach((timeline) => {
      this.$node.append('div').text(timeline.selectedDataset.name);
      const runId = timeline.selectedDataset.name;
      const epochId = timeline.singleSelected.id;

      getAPIJSON(`/malevo/confmat/cell/imageIds?runId=${runId}&epochId=${epochId}&groundTruthId=${cell.groundTruthIndex}&predictedId=${cell.predictedIndex}`)
      .then((data: number[]) => {
        const imageIds = data.join(',');
        return getAPIData(`/malevo/images/imageSprite?imageIds=${imageIds}`, {}, 'blob');
      })
      .then((imageSprite) => {
        this.$node.select('.images .loading').classed('hidden', true);
        const imageUrl = window.URL.createObjectURL(imageSprite);
        this.$node.select('.images').append('img').attr('src', imageUrl);
      });
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
  return new DetailImageTab(parent);
}
