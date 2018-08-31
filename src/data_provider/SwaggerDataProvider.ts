import { mixin } from 'phovea_core/src';
import { INumberValueTypeDesc, VALUE_TYPE_REAL } from 'phovea_core/src/datatype';
import { asMatrix, INumericalMatrix } from 'phovea_core/src/matrix';
import { createDefaultMatrixDesc, IMatrixDataDescription } from 'phovea_core/src/matrix/IMatrix';
import { IMatrixLoader2 } from 'phovea_core/src/matrix/loader';
import Matrix from 'phovea_core/src/matrix/Matrix';
import { Range } from 'phovea_core/src/range';
import { asTableFromArray, ITable } from 'phovea_core/src/table';
import { Configuration, Dataset, Fold, Run, RunApi } from '../api';
import { IMalevoDatasetCollection, IMalevoEpochInfo, MalevoDataset } from '../MalevoDataset';
import { IDataProvider } from './api';


const API_CONFIGURATION: Configuration = new Configuration({
  basePath: 'http://localhost:5000'
});

const runApi = new RunApi(API_CONFIGURATION);

export class SwaggerDataProvider implements IDataProvider {

  async load(): Promise<IMalevoDatasetCollection> {
    const runs = await runApi.getRuns();
    const dsc = {};

    for (const run of runs) {
      run.folds.forEach((_, i) => {
        const ds = new LazyMalevoDatasetProxy(run, i, 195); // TODO get dynamic number from API call
        dsc[ds.name] = ds;
      });
    }

    return dsc;
  }
}

/**
 * Proxy for MalevoDataset that retrieves the data from a Swagger run
 */
export class MalevoDatasetProxy extends MalevoDataset {

  protected _epochInfos: IMalevoEpochInfo[];

  protected _classLabels: ITable;

  constructor(protected run: Run, protected foldIndex) {
    super();
  }

  get name(): string {
    return this.run.runId + '_' + this.fold.name;
  }

  get epochInfos(): IMalevoEpochInfo[] {
    if (this._epochInfos) {
      return this._epochInfos;
    }

    // assumes that all epoch data are already available!
    return this.fold.epochdata.map((e): IMalevoEpochInfo => {
      return {
        id: e.epochId,
        name: e.epochId.toString(),
        confusionInfo: this.convertConfMatToNumericalMatrix(e.confmat.slice(), this.run.dataset.numclass)
      };
    });
  }

  get classLabels(): ITable {
    if (this._classLabels) {
      return this._classLabels;
    }

    return this.convertClassLabelsToTable(this.run.dataset);
  }

  get fold(): Fold {
    return this.run.folds[this.foldIndex];
  }

  private convertConfMatToNumericalMatrix(confMat: number[], numClass: number): INumericalMatrix {
    const epochData2d = [
      new Array(numClass + 1) // column header + 1 for id column
    ];
    while (confMat.length) {
      epochData2d.push([0, ...confMat.splice(0, numClass)]); // first index = id column
    }
    return <INumericalMatrix>(asMatrix<number>(epochData2d));
  }

  private convertClassLabelsToTable(dataset: Dataset): ITable {
    const tableArray = [
      ['_id', 'class_id', 'class_labels'],
      ...dataset.classes.map((d, i) => {
        return [i, i, d];
      })
    ];
    const table = asTableFromArray(tableArray, { keyProperty: 'class_id' });
    return table;
  }

}

/**
 * Cache loaded run data to avoid multiple API requests for folds of the same run
 */
const runWithEpochDataCache = new Map<string, Run>();

/**
 * Postpones loading the run data with the epoch data until the matrix data is requested
 */
export class LazyMalevoDatasetProxy extends MalevoDatasetProxy {

  /**
   * cache promise to avoid multiple requests
   */
  private runDataPromise: Promise<Run>;

  constructor(protected run: Run, protected foldIndex, protected numEpochs) {
    super(run, foldIndex);
  }

  /**
   * Override with a lazy matrix
   */
  get epochInfos(): IMalevoEpochInfo[] {
    if (this._epochInfos) {
      return this._epochInfos;
    }

    const epochs = new Array(this.numEpochs).fill(0);
    return epochs.map((_, i) => {
      return {
        id: i,
        name: i.toString(),
        confusionInfo: this.createLazyConfMatrix(i, this.run.dataset.numclass)
      };
    });
  }

  private createLazyConfMatrix(epochId: number, numClass: number): INumericalMatrix {
    const desc = mixin(createDefaultMatrixDesc(), {
      size: [numClass, numClass],
      value: <INumberValueTypeDesc>{ type: VALUE_TYPE_REAL, range: [0, 0] } // TODO set/update correct range
    });

    const loader: IMatrixLoader2<any> = {
      rowIds: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('rowIds() not implemented'),
      colIds: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('colIds() not implemented'),
      ids: (desc: IMatrixDataDescription<any>, range: Range) => {
        return Promise.reject('ids() not implemented');
      },
      at: (desc: IMatrixDataDescription<any>, i, j) => Promise.reject('at() not implemented'),
      rows: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('rows() not implemented'),
      cols: (desc: IMatrixDataDescription<any>, range: Range) => Promise.reject('cols() not implemented'),
      data: (desc: IMatrixDataDescription<any>, range: Range) => this.loadRunWithEpochData().then((run) => this.getConfMat(run, epochId))
    };

    return new Matrix(desc, loader);
  }

  /**
   * Load separate run data with epoch data
   * and cache the promise to avoid multiple network requests
   */
  private loadRunWithEpochData(): Promise<Run> {
    if (runWithEpochDataCache.has(this.run.runId)) {
      // check run cache first
      return Promise.resolve(runWithEpochDataCache.get(this.run.runId));
    } else if (this.runDataPromise) {
      // check for promise, i.e., if some one else is already loading
      return this.runDataPromise;
    }
    this.runDataPromise = runApi.getRunById(this.run.runId)
      .then((run) => {
        // add run to cache to avoid requests for a different fold
        runWithEpochDataCache.set(run.runId, run);
        return run;
      });
    return this.runDataPromise;
  }

  /**
   * Retrieves a confusion matrix for a given epoch
   * @param run {Run}
   * @param epochId {number}
   */
  private getConfMat(run: Run, epochId: number): number[][] {
    return convertArray1DtoArray2D(run.folds[this.foldIndex].epochdata[epochId].confmat, run.dataset.numclass);
  }

}


/**
 * Converts an input 1D array to an 2D array, by wrapping it after a specific number of items
 * @param array1d Input array
 * @param wrapAfter {number} Wrap after x items
 */
function convertArray1DtoArray2D(array1d: number[], wrapAfter: number): number[][] {
  const array2d = [];
  const array1dCopy = array1d.slice();
  while (array1dCopy.length) {
    array2d.push(array1dCopy.splice(0, wrapAfter));
  }
  return array2d;
}
