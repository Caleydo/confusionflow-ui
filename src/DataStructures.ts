/**
 * Created by Martin on 27.01.2018.
 */
export class SquareMatrix<U> implements Iterable<U> {
  values:  U[][] = [];
  private id: string;

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

  setId(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
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

  to1DArray(): Array<U> {
    return [].concat(...this.values);
  }

  clone(): SquareMatrix<U> {
    const sqm = new SquareMatrix<U>(this.order());
    for(let r = 0; r < this.order(); r++) {
      sqm.values[r] = [];
      for(let c = 0; c < this.order(); c++) {
        sqm.values[r][c] = this.values[r][c];
      }
    }
    return sqm;
  }

  // todo ask holger why this cannot be invoked
  [Symbol.iterator]() {
    let pointer = 0;
    const components = this.to1DArray();

    return {
      next(): IteratorResult<U> {
        if (pointer < components.length) {
          return {
            done: false,
            value: components[pointer++]
          };
        } else {
          return {
            done: true,
            value: null
          };
        }
      }
    };
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

export function matrixSum(matrix: NumberMatrix): number {
    return matrix.values.reduce((acc, val) => {
      return acc + val.reduce((acc2, val2) => {
        return acc2 + val2;
      }, 0);
    }, 0);
}

export function max<U>(matrix: SquareMatrix<U>, funct: (a: U) => number): number {
  const arr = matrix.to1DArray();
  const res = arr.reduce(function(a, b) {
    return Math.max(a, funct(b));
  }, funct(arr[0]));
  return res;
}

export function min<U>(matrix: SquareMatrix<U>, funct: (a: U) => number): number {
  const arr = matrix.to1DArray();
  const res = arr.reduce(function(a, b) {
    return Math.min(a, funct(b));
  }, funct(arr[0]));
  return res;
}

export function setDiagonal<U>(matrix: SquareMatrix<U>, funct: (r: number) => U) {
  for(let i = 0; i < matrix.order(); i++) {
    matrix.values[i][i] = funct(i);
  }
}

export function transform<U,V>(matrix: SquareMatrix<U>, funct: (r: number, c: number, value: U) => V) {
  const sm = new SquareMatrix<V>(matrix.order());
  const ix:V[][] = [];
  for(let r = 0; r < matrix.order(); r++) {
      ix[r] = [];
      for(let c = 0; c < matrix.order(); c++) {
        const res = funct(r, c, matrix.values[r][c]);
        ix[r][c] = res;
      }
    }
  sm.init(ix);
  return sm;
}

export interface IClassAffiliation  {
  count: number;
  label: string;
}

export interface IClassEvolution {
  values: number[];
  label: string;
}
