import {ADetailViewTab} from './ADetailViewTab';
import * as data from 'phovea_core/src/data';
import {INumericalMatrix} from 'phovea_core/src/matrix';
import {SoftmaxStampHeatmap} from './SoftmaxStampHeatmap';
import {Language} from '../language';
import {AppConstants} from '../AppConstants';

export class SoftmaxStampTab extends ADetailViewTab {
  public id: string = AppConstants.SOFTMAX_STAMP_VIEW;
  public name: string = Language.SOFTMAX_STAMP_VIEW;

  init() {
    return Promise.resolve(this);
  }

  render() {
    const promMatrix = data
        .list({'type': 'matrix'}) // use server-side filtering
        .then((list: INumericalMatrix[]) => {
          const softmaxStamps = [];
          for (const l of list) {
            const parts = l.desc.name.split('-');
            if(l.length < 0) {
              throw new Error('The received filename is not valid');
            }
            if(parts[0] === 'softmax') {
              softmaxStamps.push(l);
            }
          }
          return softmaxStamps;
        });

    promMatrix.then((r: INumericalMatrix[]) => {
      if(r === null || r === []) {
        return;
      }

      for(const s of r) {
        new SoftmaxStampHeatmap(this.$node).update(s, {x: 1, y:1});
      }

    });
  }

  clear() {
  }
}

/**
 * Factory method to create a new HeatMap instance
 * @param parent
 * @param options
 * @returns {DetailChartWindow}
 */
export function create(parent:Element, options:any) {
  return new SoftmaxStampTab(parent);
}
