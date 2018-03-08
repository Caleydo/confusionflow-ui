import {ADetailWindow} from './ADetailWindow';

export class SoftmaxStampWindow extends ADetailWindow {

  init() {
    return Promise.resolve(this);
  }

  render() {

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
  return new SoftmaxStampWindow(parent);
}
