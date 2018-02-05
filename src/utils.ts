import {hsl as d3hsl} from 'd3';

/**
 * Adapts the text color for a given background color
 * @param {string} bgColor as `#ff0000`
 * @returns {string} returns `black` or `white` for best contrast
 */
export function adaptTextColorToBgColor(bgColor: string): string {
  return d3hsl(bgColor).l > 0.5 ? 'black' : 'white';
}
