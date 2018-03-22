import {ILoadedMalevoDataset} from '../MalevoDataset';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';
import {zip} from '../utils';

/**
 * Created by Martin on 19.03.2018.
 */

export class MatrixHeatCellContent {
  colorValues: string[];
  counts: number[];
  classLabels: string[];
  indexInMultiSelection: number[];
}

export class Line {
  values: number[];
  max: number;
  classLabel: string;
}

abstract class ACellContentCalculator {
  abstract calculate(datasets: ILoadedMalevoDataset[]): {}[];
}

export class SingleEpochCalculator extends ACellContentCalculator {
  calculate(datasets: ILoadedMalevoDataset[]): {}[] {
    const transformedData = datasets.map((x) => x.singleEpochData.confusionData.to1DArray());
    const res = zip(transformedData);

    // find max value over all data points
    const maxVal = res.reduce((acc, val) => {
      return acc > Math.max(...val) ? acc : Math.max(...val);
    }, 0);

    const heatmapColorScale = d3.scale.linear()
      .domain([0, maxVal])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    return res.map((x) => {
      return {colorValues: x.map((y) => heatmapColorScale(y)), counts: x, classLabels: x.map((y) => String(y)),
        indexInMultiSelection: datasets.map((x) => x.multiEpochData.findIndex((y) => y.id === x.singleEpochData.id))};
    });
  }
}

export class MultiEpochCalculator extends ACellContentCalculator {
  calculate(datasets: ILoadedMalevoDataset[]): {}[] {
    // find max value over all data points
    const maxVal = Math.max(...datasets.map((x) => Math.max(...x.multiEpochData.map((y) => Math.max(...y.confusionData.to1DArray())))));
    const datasetData = [];
    datasets.forEach((ds: ILoadedMalevoDataset) => {
      const confData = ds.multiEpochData.map((x) => x.confusionData.to1DArray());
      datasetData.push(zip(confData));
    });
    const zipped = zip(datasetData);
    const lineCells = [];
    zipped.map((x, i) => {
      const label = datasets[0].labels[i % datasets[0].labels.length];
      return lineCells.push(x.map((y) => {
        return {values: y, max: maxVal, classLabel: label};
      }));
    });
    return lineCells;
  }
}
