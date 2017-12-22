/**
 * Created by Caleydo Team on 31.08.2016.
 */
import * as tslib_1 from "tslib";
import * as d3 from 'd3';
import DatasetSelector from './DatasetSelector';
import ConfusionMatrix from './ConfusionMatrix';
/**
 * The main class for the App app
 */
var App = (function () {
    function App(parent) {
        this.$node = d3.select(parent);
    }
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initialized.
     * @returns {Promise<App>}
     */
    App.prototype.init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                return [2 /*return*/, this.build()];
            });
        });
    };
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    App.prototype.build = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var ds, confusionMatrix, epochs;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ds = new DatasetSelector();
                        confusionMatrix = new ConfusionMatrix(this.$node);
                        return [4 /*yield*/, ds.load()];
                    case 1:
                        epochs = _a.sent();
                        confusionMatrix.render(epochs);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Show or hide the application loading indicator
     * @param isBusy
     */
    App.prototype.setBusy = function (isBusy) {
        this.$node.select('.busy').classed('hidden', !isBusy);
    };
    return App;
}());
export { App };
/**
 * Factory method to create a new app instance
 * @param parent
 * @returns {App}
 */
export function create(parent) {
    return new App(parent);
}
//# sourceMappingURL=app.js.map