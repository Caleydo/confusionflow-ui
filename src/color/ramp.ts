import {rgb as d3rgb} from 'd3';

export function rampColormap (float : number, cmap : number[][]) : any {
  const n = cmap.length;
  const colors = cmap[Math.max(0, Math.min(n - 1, Math.floor(float * n)))]
    .map((f : number) => Math.max(0, Math.min(255, Math.floor(f * 256))));
  return d3rgb(colors[0], colors[1], colors[2]);
}
