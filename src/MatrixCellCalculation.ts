import {transformSq, setDiagonal, SquareMatrix, IClassAffiliation, IClassEvolution} from './DataStructures';

export class LineChartCalculator {

  calculate(sm: SquareMatrix<number>[], labels: [number, string], skipDiagonal = true): SquareMatrix<IClassEvolution> {
    if(sm.length === 0) {
      return null;
    }
    const order = sm[0].order();

    const vals:IClassEvolution[][] = [];

    for(let r = 0; r < order; r++) {
      vals[r] = [];
      for(let c = 0; c < order; c++) {
        vals[r].push({values: [], label: labels[c][1]});
        for(const matrix of sm) {
          vals[r][c].values.push(matrix.values[r][c]);
        }
      }
    }

    const transformed = new SquareMatrix<IClassEvolution>(order);
    transformed.init(vals);

    if(skipDiagonal) {
      setDiagonal<IClassEvolution>(transformed, (r) => {
        return {values: transformed.values[r][r].values.map((v) => 0), label: labels[r][1]};
      });
    }
    return transformed;
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
