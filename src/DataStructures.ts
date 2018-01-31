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

  to1DArray(): Array<U> {
    return [].concat(...this.values);
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

export function transform<U,V>(matrix: SquareMatrix<U>, funct: (r: number, c: number, matrix: SquareMatrix<U>) => V) {
  const sm = new SquareMatrix<V>(matrix.order());
  const ix:V[][] = [];
  for(let r = 0; r < matrix.order(); r++) {
      ix[r] = [];
      for(let c = 0; c < matrix.order(); c++) {
        const res = funct(r, c, matrix);//{count: matrix.values[r][c], label: labels[c][1]};
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
