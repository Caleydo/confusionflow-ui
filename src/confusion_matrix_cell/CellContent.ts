import {ILoadedMalevoDataset} from '../MalevoDataset';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';

/**
 * Created by Martin on 19.03.2018.
 */

function zip (rows): number[][] {
  return rows[0].map((_,c)=>rows.map((row)=>row[c]));
}

export class MatrixHeatCellContent {
  colorValues: string[];
  counts: number[];
  labels: string[];
}

export class Line {
  values: number[];
  max: number;
}

export class MatrixLineCellContent {
  lines: Line[];
}

abstract class ACellContentCalculator {
  abstract calculate(datasets: ILoadedMalevoDataset[]): {}[];
}

export class HeatCellCalculator extends ACellContentCalculator {
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
      return {colorValues: x.map((y) => heatmapColorScale(y)), counts: x, labels: x.map((y) => String(y))};
    });
  }
}

export class LineCellCalculator extends ACellContentCalculator {
  calculate(datasets: ILoadedMalevoDataset[]): {}[] {
    // find max value over all data points
    const maxVal = Math.max(...datasets.map((x) => Math.max(...x.multiEpochData.map((y) => Math.max(...y.confusionData.to1DArray())))));
    const datasetData = [];
    datasets.forEach((ds: ILoadedMalevoDataset) => {
      const confData = ds.multiEpochData.map((x) => x.confusionData.to1DArray());
      datasetData.push(zip(confData));
    });
    const a = zip(datasetData);
    const b = a.map((x) => x.map((y) => {
      return {values: y, max: maxVal};
    }));
    return b;
  }
}
