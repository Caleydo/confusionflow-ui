import {HeatCellContent} from './CellContent';
import {ACell} from './Cell';
import {adaptTextColorToBgColor} from '../utils';

/**
 * Created by Martin on 19.03.2018.
 */

abstract class ACellRenderer {
  nextRenderer: ACellRenderer = null;
  setNextRenderer(renderer: ACellRenderer) {
    this.nextRenderer = renderer;
  }
  renderNext(cell: ACell) {
    this.render(cell);
    if(this.nextRenderer != null) {
      this.nextRenderer.renderNext(cell);
    }
  }
  protected abstract render(cell: ACell);
}

export class HeatCellRenderer extends ACellRenderer {
  render(cell: ACell) {
    const $subCells = cell.$node.selectAll('div').data((x) => {
      return x.content;
    });

    $subCells.enter().append('div')
      .style('background-color', (datum: string) => datum)
      .style('color', (datum: string) => adaptTextColorToBgColor(datum))
      .text((d, i) => String(d));
  }
}
