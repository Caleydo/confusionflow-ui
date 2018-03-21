import {ILoadedMalevoDataset} from '../MalevoDataset';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';

/**
 * Created by Martin on 19.03.2018.
 */

export class MatrixHeatCellContent {
  colorValues: string[];
  counts: number[];
  labels: string[];
}

abstract class ACellContentCalculator {
  abstract calculate(datasets: ILoadedMalevoDataset[]): MatrixHeatCellContent[];
}

export class HeatCellCalculator extends ACellContentCalculator {
  calculate(datasets: ILoadedMalevoDataset[]): MatrixHeatCellContent[] {
    const transformedData = datasets.map((x) => x.singleEpochData.confusionData.to1DArray());
    const zip = (rows)=>rows[0].map((_,c)=>rows.map((row)=>row[c]));
    const res = zip(transformedData);

    const max = res.reduce((acc, val) => {
      return acc > Math.max(...val) ? acc : Math.max(...val);
    }, 0);


    const heatmapColorScale = d3.scale.linear()
      .domain([0, max])
      .range(<any>AppConstants.BW_COLOR_SCALE)
      .interpolate(<any>d3.interpolateHcl);

    const z = res.map((x) => {
      return {colorValues: x.map((y) => heatmapColorScale(y)), counts: x, labels: x.map((y) => String(y))};
    });
    return z;
  }
}
