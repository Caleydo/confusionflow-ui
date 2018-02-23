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

  static CHARTVIEW = 'Chart View';
  static IMAGEVIEW = 'Image View';

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
    * Fires when the user selects a cell in a confusion matrix
    * @param predicted {number}
    * @param groundTruth {number}
    * @param labels {string[]}
    * @type {string}
    */
  static MULTI_LINE = 'multi_line';
  static SINGLE_LINE = 'single_line';

}
