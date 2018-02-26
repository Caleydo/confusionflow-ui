/**
 * Created by Martin on 25.12.2017.
 */
export class AppConstants {

  /**
   * Static constant as identification for malevo views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'malevoView';

  static EVENT_RESIZE = 'eventResize';

  static BW_COLOR_SCALE = ['white', 'gray'];

  /**
   * Ids for different detail view tabs
   * @type {string}
   */
  static CHART_VIEW = 'chartView';
  static IMAGE_VIEW = 'imageView';

  /**
   * Fires when the use selects a dataset from the selector
   * @type {string}
   */
  static EVENT_DATA_COLLECTION_SELECTED = 'eventDataCollectionSelected';

  /**
   * Fires when the user selects a timepoint (epoch)
   * @type {string}
   */
  static EVENT_EPOCH_SELECTED = 'eventEpochSelected';

  /**
   * Represent the different cell types
   * @type {string}
   */
  static MULTI_LINE_CHART_CELL = 'multi_line_chart_cell';
  static SINGLE_LINE_CHART_CELL = 'single_line_chart_cell';
  static BAR_CHART_CELL = 'bar_chart_cell';
  static LABEL_CHART_CELL = 'label_chart_cell';
  static HEATMAP_CELL = 'heatmap_cell';
  static COMBINED_CELL = 'combined_cell';
}
