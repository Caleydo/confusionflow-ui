/**
 * Created by Martin on 27.01.2018.
 */
export class SquareMatrix<U> {
  values:  U[][] = [];

  constructor(private readonly ORDER) {
  }

  init(vals: U[][]) {
    for(let r = 0; r < this.ORDER; r++) {
      this.values[r] = [];
      for(let c = 0; c < this.ORDER; c++) {
        this.values[r][c] = vals[r][c];
      }
    }
  }

  setDiagonal(vals: U[]) {
    if(vals.length !== this.ORDER) {
      throw new RangeError('Illegal array length');
    }
    for(let i = 0; i < this.order(); i++) {
      this.values[i][i] = vals[i];
    }
  }

  order(): number {
    return this.ORDER;
  }

  transpose(): SquareMatrix<U> {
    const transposedValues = this.values[0].map((_, c) => { return this.values.map((r) => { return r[c]; }); });
    const sm = new SquareMatrix<U>(this.order());
    sm.init(transposedValues);
    return sm;
  }
}

export type NumberMatrix = SquareMatrix<number>;

export function maxValue(matrix: NumberMatrix): number {
    const aggrCols = new Array(matrix.order()).fill(0);
    for(let i = 0; i < matrix.order(); i++) {
      aggrCols[i] = Math.max(...matrix.values[i]);
    }
    return Math.max(...aggrCols);
}
