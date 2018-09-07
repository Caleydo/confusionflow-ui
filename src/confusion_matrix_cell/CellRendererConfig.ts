import { ACellRenderer, IMatrixRendererChain } from './ACellRenderer';
import { ICellData } from '../ConfusionMatrix';
import { ILoadedMalevoDataset } from '../MalevoDataset';
import { SingleEpochCalculator, MultiEpochCalculator } from './CellContent';
import * as confMeasures from '../ConfusionMeasures';
import { DataStoreApplicationProperties, RenderMode } from '../DataStore';
import { zip } from '../utils';

export interface ICellRendererConfig {
  readonly data: ICellData[];
  readonly dataOverallAccuracy: number[][];
  readonly singleEpochIndex: number[];
  readonly fpFnRendererProto: IMatrixRendererChain;
  readonly confMatrixRendererProto: IMatrixRendererChain;
  readonly overallAccuracyRendererProto: IMatrixRendererChain;
  readonly labelRendererProto: IMatrixRendererChain;
  readonly classSizeRendererProto: IMatrixRendererChain;
}

abstract class CellRendererConfig {
  constructor(protected datasets: ILoadedMalevoDataset[], protected functors: ((renderer: ACellRenderer) => void)[]) {
    //
  }

  abstract get data(): ICellData[];
  abstract get dataOverallAccuracy(): number[][];
  abstract get singleEpochIndex(): number[];
  abstract get fpFnRendererProto(): IMatrixRendererChain;
  abstract get confMatrixRendererProto(): IMatrixRendererChain;
  abstract get overallAccuracyRendererProto(): IMatrixRendererChain;

  get labelRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'LabelCellRenderer', params: null }], offdiagonal: null,
      functors: []
    };
  }

  get classSizeRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'BarChartRenderer', params: [null] }], offdiagonal: null,
      functors: []
    };
  }
}

class CombinedCellRendererConfig extends CellRendererConfig {
  private _data: ICellData[];

  public get data(): ICellData[] {
    if (this._data) {
      return this._data;
    }

    const singleEpochContent = new SingleEpochCalculator().calculate(this.datasets);
    const multiEpochContent = new MultiEpochCalculator().calculate(this.datasets);
    const zippedData = zip([singleEpochContent, multiEpochContent]);
    this._data = zippedData.map((x) => ({ heatcell: x[0], linecell: x[1] }));
    return this._data;
  }

  public get dataOverallAccuracy(): number[][] {
    return this.datasets.map((x) => confMeasures.calcOverallAccuracy(x.multiEpochData.map((y) => y.confusionData)));
  }

  public get singleEpochIndex(): number[] {
    return this.data[1].heatcell.indexInMultiSelection;
  }

  public get fpFnRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [
        { renderer: 'MatrixLineCellRenderer', params: null },
        { renderer: 'VerticalLineRenderer', params: [] }
      ],
      offdiagonal: null,
      functors: this.functors
    };
  }

  public get confMatrixRendererProto(): IMatrixRendererChain {
    return {
      offdiagonal: [
        { renderer: 'HeatmapMultiEpochRenderer', params: [DataStoreApplicationProperties.transposeCellRenderer] },
        { renderer: 'SingleEpochMarker', params: [DataStoreApplicationProperties.transposeCellRenderer] }
      ],
      diagonal: [{ renderer: 'LabelCellRenderer', params: null }],
      functors: this.functors
    };
  }

  public get overallAccuracyRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [
        { renderer: 'MatrixLineCellRenderer', params: null },
        { renderer: 'VerticalLineRenderer', params: [] }
      ],
      offdiagonal: null,
      functors: []
    };
  }
}

class SingleCellRendererConfig extends CellRendererConfig {
  private _data: ICellData[];

  public get data(): ICellData[] {
    if (this._data) {
      return this._data;
    }
    const singleEpochContent = new SingleEpochCalculator().calculate(this.datasets);
    this._data = singleEpochContent.map((x) => ({ heatcell: x, linecell: null }));
    return this._data;
  }

  public get dataOverallAccuracy(): number[][] {
    return [];
  }

  public get singleEpochIndex(): number[] {
    return this.data[0].heatcell.indexInMultiSelection;
  }

  public get fpFnRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'BarChartRenderer', params: [null] }], offdiagonal: null,
      functors: this.functors
    };
  }

  public get confMatrixRendererProto(): IMatrixRendererChain {
    return {
      offdiagonal: [{ renderer: 'HeatmapSingleEpochRenderer', params: [false, false] }],
      diagonal: [{ renderer: 'LabelCellRenderer', params: null }],
      functors: this.functors
    };
  }

  public get overallAccuracyRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'BarChartRenderer', params: [null] }], offdiagonal: null,
      functors: this.functors
    };
  }

}

class MultiCellRendererConfig extends CellRendererConfig {
  private _data: ICellData[];

  public get data(): ICellData[] {
    if (this._data) {
      return this._data;
    }

    const multiEpochContent = new MultiEpochCalculator().calculate(this.datasets);
    //return multiEpochContent.map((x) => ({ heatcell: null, linecell: x }));
    this._data = [{ heatcell: null, linecell: multiEpochContent }];
    return this._data;
  }

  public get dataOverallAccuracy(): number[][] {
    return this.datasets.map((x) => confMeasures.calcOverallAccuracy(x.multiEpochData.map((y) => y.confusionData)));
  }

  public get singleEpochIndex(): number[] {
    return null;
  }

  public get fpFnRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'MatrixLineCellRenderer', params: null }], offdiagonal: null,
      functors: this.functors
    };
  }

  public get confMatrixRendererProto(): IMatrixRendererChain {
    return {
      offdiagonal: [{
        renderer: 'HeatmapMultiEpochRenderer',
        params: [DataStoreApplicationProperties.transposeCellRenderer]
      }],
      diagonal: [{ renderer: 'LabelCellRenderer', params: null }],
      functors: this.functors
    };
  }

  public get overallAccuracyRendererProto(): IMatrixRendererChain {
    return {
      diagonal: [{ renderer: 'MatrixLineCellRenderer', params: null }], offdiagonal: null,
      functors: []
    };
  }
}

export function createCellRendererConfig(renderMode: RenderMode, datasets: ILoadedMalevoDataset[], functors: ((renderer: ACellRenderer) => void)[]): CellRendererConfig {
  switch (renderMode) {
    case RenderMode.COMBINED:
      return new CombinedCellRendererConfig(datasets, functors);

    case RenderMode.SINGLE:
      return new SingleCellRendererConfig(datasets, functors);

    case RenderMode.MULTI:
      return new MultiCellRendererConfig(datasets, functors);
  }
  throw new Error('Unknown render mode. Cannot create cell renderer config.');
}
