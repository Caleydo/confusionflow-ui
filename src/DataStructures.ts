/**
 * Created by Martin on 27.01.2018.
 */

export class Matrix<U> implements Iterable<U> {
  values:  U[][] = [];
  private id: string;

  constructor(readonly ROW_COUNT, readonly COL_COUNT) {
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

  transpose(): Matrix<U> {
    const transposedValues = this.values[0].map((_, c) => { return this.values.map((r) => { return r[c]; }); });
    const sm = new Matrix<U>(this.ROW_COUNT, this.COL_COUNT);
    sm.init(transposedValues);
    return sm;
  }

  to1DArray(): Array<U> {
    return [].concat(...this.values);
  }

  setId(id: string) {
    this.id = id;
  }

  getId(): string {
    return this.id;
  }

  clone(): Matrix<U> {
    const sqm = new Matrix<U>(this.ROW_COUNT, this.COL_COUNT);
    for(let r = 0; r < this.ROW_COUNT(); r++) {
      sqm.values[r] = [];
      for(let c = 0; c < this.COL_COUNT(); c++) {
        sqm.values[r][c] = this.values[r][c];
      }
    }
    return sqm;
  }

  init(vals: U[][]) {
    for(let r = 0; r < this.ROW_COUNT; r++) {
      this.values[r] = [];
      for(let c = 0; c < this.COL_COUNT; c++) {
        this.values[r][c] = vals[r][c];
      }
    }
  }
}

export class SquareMatrix<U> extends Matrix<U> {
  constructor(private readonly ORDER) {
    super(ORDER, ORDER);
  }

  order(): number {
    return this.ORDER;
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
}

export type NumberMatrix = SquareMatrix<number>;

export function matrixSum(matrix: NumberMatrix): number {
    return matrix.values.reduce((acc, val) => {
      return acc + val.reduce((acc2, val2) => {
        return acc2 + val2;
      }, 0);
    }, 0);
}

export function max<U>(matrix: Matrix<U>, funct: (a: U) => number): number {
  const arr = matrix.to1DArray();
  const res = arr.reduce(function(a, b) {
    return Math.max(a, funct(b));
  }, funct(arr[0]));
  return res;
}

export function min<U>(matrix: Matrix<U>, funct: (a: U) => number): number {
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

export function getDiagonal<U>(matrix: SquareMatrix<U>): U[] {
  const arr: U[] = [];
  for(let i = 0; i < matrix.order(); i++) {
    arr.push(matrix.values[i][i]);
  }
  return arr;
}

export function transform<U,V>(matrix: Matrix<U>, funct: (r: number, c: number, value: U) => V): Matrix<V> {
  const nm = new Matrix<V>(matrix.ROW_COUNT, matrix.COL_COUNT);
  const ix:V[][] = [];
  for(let r = 0; r < matrix.ROW_COUNT; r++) {
      ix[r] = [];
      for(let c = 0; c < matrix.COL_COUNT; c++) {
        const res = funct(r, c, matrix.values[r][c]);
        ix[r][c] = res;
      }
    }
  nm.init(ix);
  return nm;
}

export function transformSq<U,V>(matrix: SquareMatrix<U>, funct: (r: number, c: number, value: U) => V): SquareMatrix<V> {
  const nm = new SquareMatrix<V>(matrix.order());
  const ix:V[][] = [];
  for(let r = 0; r < matrix.ROW_COUNT; r++) {
      ix[r] = [];
      for(let c = 0; c < matrix.COL_COUNT; c++) {
        const res = funct(r, c, matrix.values[r][c]);
        ix[r][c] = res;
      }
    }
  nm.init(ix);
  return nm;
}

export interface IClassAffiliation  {
  count: number;
  label: string;
}

export interface IClassEvolution {
  values: number[];
  label: string;
}
