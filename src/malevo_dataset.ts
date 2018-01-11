import {ITable} from 'phovea_core/src/table';

export class IMalevoDataset {
  epochInfos: ITable[];
}

export class MalevoDatasetCollection {
  datasets: Map<String, IMalevoDataset>;
}
