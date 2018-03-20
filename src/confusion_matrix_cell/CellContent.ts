import {ILoadedMalevoDataset} from '../MalevoDataset';
import {AppConstants} from '../AppConstants';
import * as d3 from 'd3';

/**
 * Created by Martin on 19.03.2018.
 */

export interface ICellContent {
  content: any;
}

export class HeatCellContent implements ICellContent {
  content: any;
}

abstract class ACellContentCalculator {
  abstract calculate(datasets: ILoadedMalevoDataset[], cellCount: number,
                     transformPredicate: (datum: number, index: number) => number): ICellContent[];
}

export class HeatCellCalculator extends ACellContentCalculator {
  calculate(datasets: ILoadedMalevoDataset[], cellCount: number,
            transformPredicate: (datum: number, index: number) => number): ICellContent[] {

    const transformedData = datasets.map((x) => x.singleEpochData.confusionData.to1DArray().map((y,i) => transformPredicate(y, i)));
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
      return {content: x.map((y) => heatmapColorScale(y))};
    });
    return z;
  }
}
