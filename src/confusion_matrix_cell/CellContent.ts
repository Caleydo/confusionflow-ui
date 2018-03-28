import {ILoadedMalevoDataset} from '../MalevoDataset';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import {zip} from '../utils';

/**
 * Created by Martin on 19.03.2018.
 */

export class MatrixHeatCellContent {
  maxVal: number;
  counts: number[];
  classLabels: string[];
  indexInMultiSelection: number[];
}

export class Line {
  values: number[];
  max: number;
  classLabel: string;
  color: string;
}

abstract class ACellContentCalculator {
  abstract calculate(datasets: ILoadedMalevoDataset[]): Line[] | MatrixHeatCellContent[];
}

export class SingleEpochCalculator extends ACellContentCalculator {
  constructor(private removeMainDiagonal = true) {
    super();
  }

  calculate(datasets: ILoadedMalevoDataset[]): MatrixHeatCellContent[] {
    const transformedData = datasets.map((x) => x.singleEpochData.confusionData.to1DArray());
    const res = zip(transformedData);

    if(this.removeMainDiagonal) {
      res.forEach((x, i) => {
        if (i % 11 === 0) {
          res[i] = res[i].map((x) => 0);
        }
      });
    }

    // find max value over all data points
    const maxVal = res.reduce((acc, val) => {
      return acc > Math.max(...val) ? acc : Math.max(...val);
    }, 0);


    const heatmapColorScale = d3.scale.linear()
      .domain([0, maxVal])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    return res.map((x, i) => {
      if(this.removeMainDiagonal &&  i % 11 === 0) {
        return {
          maxVal: 0, counts: [], classLabels: [],
          indexInMultiSelection: []
        };
      } else {
        return {
          maxVal, counts: x, classLabels: x.map((y) => String(y)),
          indexInMultiSelection: datasets.map((x) => x.multiEpochData.findIndex((y) => y.id === x.singleEpochData.id))
        };
      }
    });
  }
}

export class MultiEpochCalculator extends ACellContentCalculator {
  constructor(private removeMainDiagonal = true) {
    super();
  }
  calculate(datasets: ILoadedMalevoDataset[]): Line[] {
    const datasetData = [];
    datasets.forEach((ds: ILoadedMalevoDataset) => {
      const confData = ds.multiEpochData.map((x) => x.confusionData.to1DArray());

      datasetData.push(zip(confData));
    });
    const zipped = zip(datasetData);

    if(this.removeMainDiagonal) {
      zipped.forEach((x, i) => {
        if (i % 11 === 0) {
          zipped[i] = zipped[i].map((x) => x.map((y) => 0));
        }
      });
    }

    const maxVal = zipped.reduce((acc: number, val) => {
      const res = val.map((x) => Math.max(...x.map((y) => y)));
      return Math.max(...res) > acc ? Math.max(...res) : acc;
    }, 0);

    const multiEpochData = [];
    zipped.map((x, i) => {
      const label = datasets[0].labels[i % datasets[0].labels.length];
      return multiEpochData.push(x.map((y, dsIndex) => {
        if(this.removeMainDiagonal && i % 11 === 0) {
          return {values: [], max: 0, classLabel: label, color: datasets[dsIndex].datasetColor};
        } else {
          return {values: y, max: maxVal, classLabel: label, color: datasets[dsIndex].datasetColor};
        }
      }));
    });
    return multiEpochData;
  }
}
