import {transformSq, setDiagonal, SquareMatrix, IClassAffiliation} from './DataStructures';

export class LineChartCalculator {

  calculate(sm: SquareMatrix<number>[], skipDiagonal = true): SquareMatrix<number[]> {
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

    if(skipDiagonal) {
      setDiagonal(newMatrix, (r) => {return [];});
    }
    return newMatrix;
  }
}

export class BarChartCalculator {
  calculate(sm: SquareMatrix<number>, labels: [number, string], skipDiagonal = true): SquareMatrix<IClassAffiliation> {
    const transformed = transformSq<number, IClassAffiliation>(sm, (r, c, matrix) => {return {count: matrix.values[r][c], label: labels[c][1]};});
    if(skipDiagonal === true) {
      setDiagonal<IClassAffiliation>(transformed, (r) => {
        return {count: 0, label: labels[r][1]};
      });
    }
    return transformed;
  }
}
