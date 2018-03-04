import {ADetailViewTab} from './ADetailViewTab';
import * as data from 'phovea_core/src/data';
import {INumericalMatrix} from 'phovea_core/src/matrix';

export class SoftmaxStampTab extends ADetailViewTab {

  render() {
    const promMatrix = data
        .list({'type': 'matrix'}) // use server-side filtering
        .then((list: INumericalMatrix[]) => {
          for (const l of list) {
            const parts = l.desc.name.split('-');
            if(l.length < 0) {
              throw new Error('The received filename is not valid');
            }
            if(parts[0] === 'softmax') {
              console.log('process softmax');
            }
          }
        });

    promMatrix.then((r) => {
      console.log('render now');
    });
  }

  clear() {
  }
}
