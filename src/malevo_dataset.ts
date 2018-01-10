import {ITable} from 'phovea_core/src/table';

export class IMalevoDataset {
  epochs: ITable[];
}

export class MalevoDatasetCollection {
  datasets: Map<String, IMalevoDataset>;
}
