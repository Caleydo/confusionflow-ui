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
    const cell = DataStoreCellSelection.getCell();
    if (!cell || !(cell instanceof MatrixCell)) {
      return;
    }
    if (!cell.data.heatcell) {
      return;
    }

    this.$node.html(`
      <p class="chart-name"><strong>${cell.groundTruthLabel}</strong> ${Language.PREDICTED_AS} <strong>${cell.predictedLabel}</strong></p>
      <div class="images"></div>
    `);

    dataStoreTimelines.forEach((timeline) => {
      const $section = this.$node.select('.images').append('section')
        .html(`
          <p><strong>${timeline.selectedDataset.name}</strong></p>
          <div class="result"><div class="loading"><i class="fa fa-circle-o-notch fa-spin fa-fw"></i> Loading images...</div></div>
        `);
      const runId = timeline.selectedDataset.name;
      const epochId = timeline.singleSelected.id;

      getAPIJSON(`/malevo/confmat/cell/imageIds?runId=${runId}&epochId=${epochId}&groundTruthId=${cell.groundTruthIndex}&predictedId=${cell.predictedIndex}`)
        .then((data: number[]) => {
          const imageIds = data.join(',');
          return getAPIData(`/malevo/images/imageSprite?imageIds=${imageIds}`, {}, 'blob');
        })
        .then((imageSprite) => {
          $section.select('.result .loading').classed('hidden', true);
          const imageUrl = window.URL.createObjectURL(imageSprite);
          $section.select('.result').append('img').attr('src', imageUrl);
        });
    });
  }

  clear() {
    this.$node.html(``);
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {DetailChartWindow}
 */
export function create(parent: Element, options: any) {
  return new DetailImageTab(parent);
}
