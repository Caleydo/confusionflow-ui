import * as d3 from 'd3';
import {IAppView} from './app';
import {ConfusionMatrix} from './ConfusionMatrix';
import {AppConstants} from './AppConstants';
import * as events from 'phovea_core/src/event';
import {Language} from './language';
import {getAPIData, getAPIJSON} from 'phovea_core/src/ajax';
import {DataStore} from './DataStore';
import {extractEpochId} from './utils';


export class DummyDetailView implements IAppView {

  private readonly $node: d3.Selection<any>;

  constructor(parent:Element) {
    this.$node = d3.select(parent)
      .append('div')
      .classed('detail-view', true);
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initialized.
   * @returns {Promise<DummyDetailView>}
   */
  init() {
    this.attachListeners();
    this.setupLayout();
    // return the promise directly as long there is no dynamical data to update
    return Promise.resolve(this);
  }

  private attachListeners() {
    events.on(AppConstants.EVENT_CELL_SELECTED, (evt, src, predicted: number, groundTruth: number, labels) => {
      this.update(predicted, groundTruth, labels);
    });
  }

  private setupLayout() {
    this.$node.html(`
      <p class="title"></p>
      <div class="images"><img id="sprite" /></div>
    `);
  }


  private update(predicted: number, groundTruth: number, labels) {
    this.$node.select('.title')
        .html(`<strong>${labels[groundTruth][1]}</strong> ${Language.PREDICTED_AS} <strong>${labels[predicted][1]}</strong>`);

    const epochId = extractEpochId(DataStore.singleSelected);

    getAPIJSON(`/malevo/confmat/cell/imageIds?epochId=${epochId}&groundTruthId=${groundTruth}&predictedId=${predicted}`)
      .then((data: number[]) => {
        const imageIds = data.join(',');
        return getAPIData(`/malevo/images/imageSprite?imageIds=${imageIds}`, {}, 'blob');
      })
      .then((imageSprite) => {
        const imageUrl = window.URL.createObjectURL(imageSprite);
        this.$node.select('#sprite').attr('src', imageUrl);
      });
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {ConfusionMatrix}
 */
export function create(parent:Element, options:any) {
  return new DummyDetailView(parent);
}
