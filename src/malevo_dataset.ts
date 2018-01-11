import {ITable} from 'phovea_core/src/table';

export class IMalevoDataset {
  name: string;
  epochInfos: ITable[];
}

export interface IMalevoDatasetCollection {
  [key: string]: IMalevoDataset;
}
