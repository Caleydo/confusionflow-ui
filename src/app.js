/**
 * Created by Martin on 22.12.2016.
 */
import * as plugins from 'phovea_core/src/plugin';
import * as d3 from 'd3';
import * as events from 'phovea_core/src/event';
import { AppConstants } from './AppConstants';
/**
 * The main class for the app
 */
var App = (function () {
    function App(parent) {
        this.views = [
            {
                view: 'DataSetSelector',
                parent: 'selector',
                options: {}
            },
            {
                view: 'ConfusionMatrix',
                parent: 'comparison',
                options: {
                    eventName: ''
                }
            },
            {
                view: 'Timeline',
                parent: 'selector-timepoint',
                options: {
                    eventName: ''
                }
            }
        ];
        this.$node = d3.select(parent);
        this.$node.append('div').classed('selector-timepoint', true);
        this.$node.append('div').classed('comparison', true);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<App>}
     */
    App.prototype.init = function () {
        this.attachListener();
        return this.build();
    };
    App.prototype.attachListener = function () {
        window.addEventListener('resize', function () {
            events.fire(AppConstants.EVENT_RESIZE);
        });
    };
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    App.prototype.build = function () {
        var _this = this;
        // wrap view ids from package.json as plugin and load the necessary files
        var pluginPromises = this.views
            .map(function (d) { return plugins.get(AppConstants.VIEW, d.view); })
            .filter(function (d) { return d !== undefined; }) // filter views that does not exists
            .map(function (d) { return d.load(); });
        // when everything is loaded, then create and init the views
        var buildPromise = Promise.all(pluginPromises)
            .then(function (plugins) {
            _this.$node.select('h3').remove(); // remove loading text from index.html template
            var initPromises = plugins.map(function (p, index) {
                var view = p.factory(_this.$node.select("." + _this.views[index].parent).node(), // parent node
                _this.views[index].options || {} // options
                );
                return view.init();
            });
            // wait until all views are initialized, before going to next then
            return Promise.all(initPromises);
        })
            .then(function (viewInstances) {
            // loading and initialization has finished -> hide loading indicator
            return _this;
        });
        return buildPromise;
    };
    return App;
}());
export { App };
/**
 * Factory method to create a new Malevo instance
 * @param parent
 * @returns {App}
 */
export function create(parent) {
    return new App(parent);
}
//# sourceMappingURL=app.js.map