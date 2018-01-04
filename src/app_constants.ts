/**
 * Created by Martin on 25.12.2017.
 */
export class AppConstants {

  /**
   * Static constant as identification for TACO views
   * Note: the string value is referenced for multiple view definitions in the package.json,
   *       i.e. be careful when refactor the value
   */
  static VIEW = 'malevoView';

  static EVENT_RESIZE = 'eventResize';

  /**
   * Initial size of a heatmap cell
   * @type {number}
   */
  static HEATMAP_CELL_SIZE = 5;

  /**
   * Event that is fired when a data set collection has been selected
   * @type {string}
   */
  static EVENT_DATA_COLLECTION_SELECTED = 'eventDataCollectionSelected';

  static EVENT_TIME_POINTS_SELECTED = 'eventTimePointsSelected';

  static EVENT_DIFF_HEATMAP_LOADED = 'eventDiffHeatmapLoaded';

  static MAXIMAL_HEATMAP_LABEL_SIZE = 70;

  static EVENT_HEATMAP_LOADED = 'eventHeatmapLoaded';

  /**
   * Property for the URL hash
   * @type {{DATASET: string; TIME_POINTS: string; DETAIL_VIEW: string}}
   */
  static HASH_PROPS = {
    DATASET: 'ds',
    TIME_POINTS: 'tp',
    DETAIL_VIEW: 'detail',
    FILTER: 'f',
    SELECTION: 's'
  };

  /**
   * Parse the following date formats from strings using moment.js (see http://momentjs.com/docs/#/parsing/)
   * @type {string[]}
   */
  static PARSE_DATE_FORMATS = ['YYYY_MM_DD', 'YYYY-MM-DD', 'YYYY'];

  static TIMELINE_BAR_WIDTH = 16;
}
