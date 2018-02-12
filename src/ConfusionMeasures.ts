// measures are from https://en.wikipedia.org/wiki/Confusion_matrix
import {NumberMatrix, Matrix, matrixSum, SquareMatrix, IClassEvolution} from './DataStructures';

export function TP(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrix.values[index][index];
}

export function FP(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrix.values[index].reduce((acc, val) => acc + val, 0) - matrix.values[index][index];
}

export function FN(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  matrix = <SquareMatrix<number>> matrix.transpose();
  return matrix.values[index].reduce((acc, val) => acc + val, 0) - matrix.values[index][index];
}

export function TN(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  return matrixSum(matrix) - TP(matrix, index) - FP(matrix, index) - FN(matrix, index);
}

export function TPR(matrix: NumberMatrix, index: number): number {
  return TP(matrix, index) / (TP(matrix, index) + FN(matrix, index));
}

export function ACC(matrix: NumberMatrix, index: number): number {
  return (TP(matrix, index) + TN(matrix, index)) / (TP(matrix, index) + TN(matrix, index) + FP(matrix, index) + FN(matrix, index));
}

export function PPV(matrix: NumberMatrix, index: number): number {
  return TP(matrix, index) / (TP(matrix, index) + FP(matrix, index));
}

export function F1(matrix: NumberMatrix, index: number): number {
  return 2 * ((PPV(matrix, index) * TPR(matrix, index)) / (PPV(matrix, index) + TPR(matrix, index)));
}

export function calcForMultipleClasses(matrix: NumberMatrix, funct: (matrix: NumberMatrix, index: number) => number): number[] {
  const result = [];
  for(let i = 0; i < matrix.order(); i++) {
    result.push(funct(matrix, i));
  }
  return result;
}

export function calcEvolution(matrices: NumberMatrix[], funct: (matrix: NumberMatrix, index: number) => number): Matrix<IClassEvolution> {
  const order = matrices[0].order();
  if(matrices.length === 0) {
    return new Matrix<IClassEvolution>(0, 0);
  }
  const matrix = new Matrix<IClassEvolution>(order, 1);
  const arr:IClassEvolution[][] = [];
  for(let i = 0; i < order; i++) {
    arr[i] = [];
    arr[i][0] = {values: [], label: ''};
  }
  matrix.init(arr);

  for(const m of matrices) {
    const res = calcForMultipleClasses(m, funct);
    matrix.values.map((c, i) => c[0].values.push(res[i]));
  }
  return matrix;
}
