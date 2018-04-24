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

  /**
   * Fires when the user changes one of the timeline
   * @type {string}
   */
  static EVENT_TIMELINE_CHANGED = 'eventTimelineChanged';

  /**
   * Ids for different detail view tabs
   * @type {string}
   */
  static CHART_VIEW = 'chartView';
  static IMAGE_VIEW = 'imageView';
  static SOFTMAX_STAMP_VIEW = 'softmaxStampView';

  /**
   * Fires when the use selects a dataset from the selector
   * @type {string}
   */
  static EVENT_DATA_SET_ADDED = 'eventDataSetAdded';

  /**
   * Fires when the use unselects a dataset from the selector
   * @type {string}
   */
  static EVENT_DATA_SET_REMOVED = 'eventDataSetRemoved';

  /**
   * Fires when the detail view should be cleared
   */
  static CLEAR_DETAIL_VIEW = 'clearDetailView';

  /**
   * Fires when the confusion matrix has to be redrawn
   * @type {string}
   */
  static EVENT_REDRAW = 'eventRedraw';

  static EVENT_CELL_SELECTED = 'eventCellSelected';

  /**
   * Represent the different cell types
   * @type {string}
   */
  static CELL_FP = 'cellFP';
  static CELL_FN = 'cellFN';
  static CELL_PRECISION = 'cellPrecision';

  /**
   * Initial size of a heatmap cells for the softmax stampx
   * @type {number}
   */
  static SOFTMAX_HEATMAP_CELL_SIZE = 5;

  static SOFTMAX_MAXIMAL_HEATMAP_LABEL_SIZE = 70;

  // Specifies how many dataset can be selected in the dataset selector at most
  static MAX_DATASET_COUNT = 4;

  /**
   * Size of timeline components
   */
  static TML_HEIGHT = 35;
}
