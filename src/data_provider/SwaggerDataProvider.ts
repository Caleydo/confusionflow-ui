import { IDataProvider } from './api';
import { IMalevoDatasetCollection, MalevoDataset, IMalevoEpochInfo } from '../MalevoDataset';
import { RunApi, Run, Configuration, Fold, EpochData, Dataset } from '../api';
import { asMatrix, IMatrix, INumericalMatrix } from 'phovea_core/src/matrix';
import { INumberValueTypeDesc } from 'phovea_core/src/datatype';
import { ITable, asTableFromArray, asTable } from 'phovea_core/src/table';


const API_CONFIGURATION: Configuration = new Configuration({
  basePath: 'http://localhost:5000'
});

export class SwaggerDataProvider implements IDataProvider {

  private runApi: RunApi;

  constructor() {
    this.runApi = new RunApi(API_CONFIGURATION);
  }

  async load(): Promise<IMalevoDatasetCollection> {
    const runs = await this.runApi.getRuns();
    const dsc = {};

    for (const r of runs) {
      const run = await this.runApi.getRunById(r.runId);
      run.folds.forEach((_, i) => {
        const ds = new MalevoDatasetProxy(run, i);
        dsc[ds.name] = ds;
      });
    }

    return dsc;
  }
}

export class MalevoDatasetProxy extends MalevoDataset {

  private _epochInfos: IMalevoEpochInfo[];

  private _classLabels: ITable;

  constructor(private run: Run, private foldIndex = 0) {
    super();
  }

  get name(): string {
    return this.run.runId + '_' + this.fold.name;
  }

  get epochInfos(): IMalevoEpochInfo[] {
    if (this._epochInfos) {
      return this._epochInfos;
    }

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

    return this.convertClassNamesToTable(this.run.dataset);
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

  private convertClassNamesToTable(dataset: Dataset): ITable {
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
