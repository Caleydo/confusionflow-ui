// measures are from https://en.wikipedia.org/wiki/Confusion_matrix
import {NumberMatrix, matrixSum} from './DataStructures';

export function TP(matrix: NumberMatrix, index: number): number {
  if(index >= matrix.order()) {
    throw new Error('Invalid index');
  }
  //todo try to get rid of this matrix.values[][] ugliness!
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
  matrix = matrix.transpose();
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
  const result = []
  for(let i = 0; i < matrix.order(); i++) {
    result.push(funct(matrix, i));
  }
  return result;
}
