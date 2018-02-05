import {SquareMatrix, IClassEvolution} from './DataStructures';
interface ICellCalculator {
  calculate(sm: SquareMatrix<number>[]): SquareMatrix<number[]>;
}

export class LineChartCalculator implements ICellCalculator {

  calculate(sm: SquareMatrix<number>[]): SquareMatrix<number[]> {
    if(sm.length === 0) {
      return null;
    }
    const order = sm[0].order();

    const vals:number[][][] = [];

    for(let r = 0; r < order; r++) {
      vals[r] = [];
      for(let c = 0; c < order; c++) {
        const acc = [];
        for(const matrix of sm) {
          acc.push(matrix.values[r][c]);
        }
        vals[r][c] = acc;
      }
    }

    const newMatrix = new SquareMatrix<number[]>(order);
    newMatrix.init(vals);
    return newMatrix;
  }
}
