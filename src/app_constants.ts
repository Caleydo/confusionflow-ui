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
   * Initial size of a heatmap cell
   * @type {number}
   */
  static HEATMAP_CELL_SIZE = 5;

  /**
   * Event that is fired when a data set collection has been selected
   * @type {string}
   */
  static EVENT_DATA_COLLECTION_SELECTED = 'eventDataCollectionSelected'; // Fires when the use selects a dataset from the selector

  static EVENT_EPOCH_SELECTED = 'eventEpochSelected'; // Fires when the user selects a timepoint (epoch)

  //todo handle in "heatmap" issue
  static EVENT_DIFF_HEATMAP_LOADED = 'eventDiffHeatmapLoaded';

  static MAXIMAL_HEATMAP_LABEL_SIZE = 70;

  static EVENT_HEATMAP_LOADED = 'eventHeatmapLoaded';

}
