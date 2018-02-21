export abstract class ADetailView {
  constructor(public name: string, protected $parent: d3.Selection<any>) {

  }
  abstract show();
}
