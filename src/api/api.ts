// tslint:disable
/// <reference path="./custom.d.ts" />
/**
 * ConfusionFlow
 * This is the initial API proposal for the ConfusionFlow REST API
 *
 * OpenAPI spec version: 0.0.2
 * Contact: gfrogat@gmail.com
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */


import * as url from "url";
import * as portableFetch from "portable-fetch";
import { Configuration } from "./configuration";

const BASE_PATH = "https://localhost/api".replace(/\/+$/, "");

/**
 *
 * @export
 */
export const COLLECTION_FORMATS = {
    csv: ",",
    ssv: " ",
    tsv: "\t",
    pipes: "|",
};

/**
 *
 * @export
 * @interface FetchAPI
 */
export interface FetchAPI {
    (url: string, init?: any): Promise<Response>;
}

/**
 *
 * @export
 * @interface FetchArgs
 */
export interface FetchArgs {
    url: string;
    options: any;
}

/**
 *
 * @export
 * @class BaseAPI
 */
export class BaseAPI {
    protected configuration: Configuration;

    constructor(configuration?: Configuration, protected basePath: string = BASE_PATH, protected fetch: FetchAPI = portableFetch) {
        if (configuration) {
            this.configuration = configuration;
            this.basePath = configuration.basePath || this.basePath;
        }
    }
};

/**
 *
 * @export
 * @class RequiredError
 * @extends {Error}
 */
export class RequiredError extends Error {
    name: "RequiredError"
    constructor(public field: string, msg?: string) {
        super(msg);
    }
}

/**
 *
 * @export
 * @interface ClassCount
 */
export interface ClassCount {
    /**
     *
     * @type {string}
     * @memberof ClassCount
     */
    classname?: string;
    /**
     *
     * @type {number}
     * @memberof ClassCount
     */
    instancecount?: number;
}

/**
 *
 * @export
 * @interface Dataset
 */
export interface Dataset {
    /**
     *
     * @type {string}
     * @memberof Dataset
     */
    datasetId?: string;
    /**
     *
     * @type {string}
     * @memberof Dataset
     */
    description?: string;
    /**
     *
     * @type {number}
     * @memberof Dataset
     */
    numclass?: number;
    /**
     *
     * @type {number}
     * @memberof Dataset
     */
    numfolds?: number;
    /**
     *
     * @type {Array&lt;string&gt;}
     * @memberof Dataset
     */
    classes?: Array<string>;
    /**
     *
     * @type {Array&lt;Fold&gt;}
     * @memberof Dataset
     */
    folds?: Array<Fold>;
}

/**
 *
 * @export
 * @interface EpochData
 */
export interface EpochData {
    /**
     *
     * @type {number}
     * @memberof EpochData
     */
    epochId?: number;
    /**
     *
     * @type {Array&lt;number&gt;}
     * @memberof EpochData
     */
    confmat?: Array<number>;
}

/**
 *
 * @export
 * @interface Fold
 */
export interface Fold {
    /**
     *
     * @type {string}
     * @memberof Fold
     */
    foldId?: string;
    /**
     *
     * @type {string}
     * @memberof Fold
     */
    description?: string;
    /**
     * #/definitions/Dataset/properties/datasetId
     * @type {string}
     * @memberof Fold
     */
    dataset?: string;
    /**
     *
     * @type {number}
     * @memberof Fold
     */
    numinstances?: number;
    /**
     *
     * @type {Array&lt;ClassCount&gt;}
     * @memberof Fold
     */
    classcounts?: Array<ClassCount>;
}

/**
 *
 * @export
 * @interface FoldLog
 */
export interface FoldLog {
    /**
     *
     * @type {string}
     * @memberof FoldLog
     */
    foldlogId?: string;
    /**
     *
     * @type {string}
     * @memberof FoldLog
     */
    description?: string;
    /**
     * #/definitions/Run/properties/runId
     * @type {string}
     * @memberof FoldLog
     */
    runId?: string;
    /**
     * #/definitions/Fold/properties/foldId
     * @type {string}
     * @memberof FoldLog
     */
    foldId?: string;
    /**
     *
     * @type {number}
     * @memberof FoldLog
     */
    numepochs?: number;
}

/**
 *
 * @export
 * @interface FoldLogData
 */
export interface FoldLogData {
    /**
     *
     * @type {string}
     * @memberof FoldLogData
     */
    foldlogId?: string;
    /**
     *
     * @type {number}
     * @memberof FoldLogData
     */
    numepochs?: number;
    /**
     *
     * @type {Array&lt;EpochData&gt;}
     * @memberof FoldLogData
     */
    epochdata?: Array<EpochData>;
}

/**
 *
 * @export
 * @interface HyperParam
 */
export interface HyperParam {
    /**
     *
     * @type {string}
     * @memberof HyperParam
     */
    arch?: string;
    /**
     *
     * @type {string}
     * @memberof HyperParam
     */
    optim?: string;
    /**
     *
     * @type {number}
     * @memberof HyperParam
     */
    bs?: number;
    /**
     *
     * @type {Array&lt;number&gt;}
     * @memberof HyperParam
     */
    lr?: Array<number>;
    /**
     *
     * @type {Array&lt;number&gt;}
     * @memberof HyperParam
     */
    m?: Array<number>;
}

/**
 *
 * @export
 * @interface Run
 */
export interface Run {
    /**
     *
     * @type {string}
     * @memberof Run
     */
    runId?: string;
    /**
     * #/definitions/Fold/properties/foldId
     * @type {string}
     * @memberof Run
     */
    trainfoldId?: string;
    /**
     *
     * @type {HyperParam}
     * @memberof Run
     */
    hyperparam?: HyperParam;
    /**
     *
     * @type {Array&lt;FoldLog&gt;}
     * @memberof Run
     */
    foldlogs?: Array<FoldLog>;
}

/**
 *
 * @export
 * @interface View
 */
export interface View {
    /**
     *
     * @type {string}
     * @memberof View
     */
    viewId?: string;
    /**
     *
     * @type {Array&lt;string&gt;}
     * @memberof View
     */
    runs?: Array<string>;
}


/**
 * DatasetApi - fetch parameter creator
 * @export
 */
export const DatasetApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Returns a single dataset
         * @summary Get dataset by ID
         * @param {string} datasetId ID of dataset to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasetById(datasetId: string, options: any = {}): FetchArgs {
            // verify required parameter 'datasetId' is not null or undefined
            if (datasetId === null || datasetId === undefined) {
                throw new RequiredError('datasetId','Required parameter datasetId was null or undefined when calling getDatasetById.');
            }
            const localVarPath = `/dataset/{datasetId}`
                .replace(`{${"datasetId"}}`, encodeURIComponent(String(datasetId)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @summary Show all available datasets
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasets(options: any = {}): FetchArgs {
            const localVarPath = `/datasets`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * DatasetApi - functional programming interface
 * @export
 */
export const DatasetApiFp = function(configuration?: Configuration) {
    return {
        /**
         * Returns a single dataset
         * @summary Get dataset by ID
         * @param {string} datasetId ID of dataset to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasetById(datasetId: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Dataset> {
            const localVarFetchArgs = DatasetApiFetchParamCreator(configuration).getDatasetById(datasetId, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @summary Show all available datasets
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasets(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Array<Dataset>> {
            const localVarFetchArgs = DatasetApiFetchParamCreator(configuration).getDatasets(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * DatasetApi - factory interface
 * @export
 */
export const DatasetApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * Returns a single dataset
         * @summary Get dataset by ID
         * @param {string} datasetId ID of dataset to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasetById(datasetId: string, options?: any) {
            return DatasetApiFp(configuration).getDatasetById(datasetId, options)(fetch, basePath);
        },
        /**
         *
         * @summary Show all available datasets
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getDatasets(options?: any) {
            return DatasetApiFp(configuration).getDatasets(options)(fetch, basePath);
        },
    };
};

/**
 * DatasetApi - object-oriented interface
 * @export
 * @class DatasetApi
 * @extends {BaseAPI}
 */
export class DatasetApi extends BaseAPI {
    /**
     * Returns a single dataset
     * @summary Get dataset by ID
     * @param {} datasetId ID of dataset to return
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DatasetApi
     */
    public getDatasetById(datasetId: string, options?: any) {
        return DatasetApiFp(this.configuration).getDatasetById(datasetId, options)(this.fetch, this.basePath);
    }

    /**
     *
     * @summary Show all available datasets
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof DatasetApi
     */
    public getDatasets(options?: any) {
        return DatasetApiFp(this.configuration).getDatasets(options)(this.fetch, this.basePath);
    }

}

/**
 * FoldlogApi - fetch parameter creator
 * @export
 */
export const FoldlogApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Returns a single foldlog
         * @summary Get foldlog by ID
         * @param {string} foldlogId ID of foldlog to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogById(foldlogId: string, options: any = {}): FetchArgs {
            // verify required parameter 'foldlogId' is not null or undefined
            if (foldlogId === null || foldlogId === undefined) {
                throw new RequiredError('foldlogId','Required parameter foldlogId was null or undefined when calling getFoldLogById.');
            }
            const localVarPath = `/foldlog/{foldlogId}`
                .replace(`{${"foldlogId"}}`, encodeURIComponent(String(foldlogId)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         * Returns data for a single foldlog
         * @summary Get FoldLogData by ID
         * @param {string} foldlogId ID of foldlog to return data
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogDataById(foldlogId: string, options: any = {}): FetchArgs {
            // verify required parameter 'foldlogId' is not null or undefined
            if (foldlogId === null || foldlogId === undefined) {
                throw new RequiredError('foldlogId','Required parameter foldlogId was null or undefined when calling getFoldLogDataById.');
            }
            const localVarPath = `/foldlog/{foldlogId}/data`
                .replace(`{${"foldlogId"}}`, encodeURIComponent(String(foldlogId)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * FoldlogApi - functional programming interface
 * @export
 */
export const FoldlogApiFp = function(configuration?: Configuration) {
    return {
        /**
         * Returns a single foldlog
         * @summary Get foldlog by ID
         * @param {string} foldlogId ID of foldlog to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogById(foldlogId: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<FoldLog> {
            const localVarFetchArgs = FoldlogApiFetchParamCreator(configuration).getFoldLogById(foldlogId, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         * Returns data for a single foldlog
         * @summary Get FoldLogData by ID
         * @param {string} foldlogId ID of foldlog to return data
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogDataById(foldlogId: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<FoldLogData> {
            const localVarFetchArgs = FoldlogApiFetchParamCreator(configuration).getFoldLogDataById(foldlogId, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * FoldlogApi - factory interface
 * @export
 */
export const FoldlogApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * Returns a single foldlog
         * @summary Get foldlog by ID
         * @param {string} foldlogId ID of foldlog to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogById(foldlogId: string, options?: any) {
            return FoldlogApiFp(configuration).getFoldLogById(foldlogId, options)(fetch, basePath);
        },
        /**
         * Returns data for a single foldlog
         * @summary Get FoldLogData by ID
         * @param {string} foldlogId ID of foldlog to return data
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getFoldLogDataById(foldlogId: string, options?: any) {
            return FoldlogApiFp(configuration).getFoldLogDataById(foldlogId, options)(fetch, basePath);
        },
    };
};

/**
 * FoldlogApi - object-oriented interface
 * @export
 * @class FoldlogApi
 * @extends {BaseAPI}
 */
export class FoldlogApi extends BaseAPI {
    /**
     * Returns a single foldlog
     * @summary Get foldlog by ID
     * @param {} foldlogId ID of foldlog to return
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FoldlogApi
     */
    public getFoldLogById(foldlogId: string, options?: any) {
        return FoldlogApiFp(this.configuration).getFoldLogById(foldlogId, options)(this.fetch, this.basePath);
    }

    /**
     * Returns data for a single foldlog
     * @summary Get FoldLogData by ID
     * @param {} foldlogId ID of foldlog to return data
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof FoldlogApi
     */
    public getFoldLogDataById(foldlogId: string, options?: any) {
        return FoldlogApiFp(this.configuration).getFoldLogDataById(foldlogId, options)(this.fetch, this.basePath);
    }

}

/**
 * RunApi - fetch parameter creator
 * @export
 */
export const RunApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Returns a single run
         * @summary Get run by ID
         * @param {string} runId ID of run to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRunById(runId: string, options: any = {}): FetchArgs {
            // verify required parameter 'runId' is not null or undefined
            if (runId === null || runId === undefined) {
                throw new RequiredError('runId','Required parameter runId was null or undefined when calling getRunById.');
            }
            const localVarPath = `/run/{runId}`
                .replace(`{${"runId"}}`, encodeURIComponent(String(runId)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @summary Show all available runs
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRuns(options: any = {}): FetchArgs {
            const localVarPath = `/runs`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * RunApi - functional programming interface
 * @export
 */
export const RunApiFp = function(configuration?: Configuration) {
    return {
        /**
         * Returns a single run
         * @summary Get run by ID
         * @param {string} runId ID of run to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRunById(runId: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Run> {
            const localVarFetchArgs = RunApiFetchParamCreator(configuration).getRunById(runId, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @summary Show all available runs
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRuns(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Array<Run>> {
            const localVarFetchArgs = RunApiFetchParamCreator(configuration).getRuns(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * RunApi - factory interface
 * @export
 */
export const RunApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * Returns a single run
         * @summary Get run by ID
         * @param {string} runId ID of run to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRunById(runId: string, options?: any) {
            return RunApiFp(configuration).getRunById(runId, options)(fetch, basePath);
        },
        /**
         *
         * @summary Show all available runs
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getRuns(options?: any) {
            return RunApiFp(configuration).getRuns(options)(fetch, basePath);
        },
    };
};

/**
 * RunApi - object-oriented interface
 * @export
 * @class RunApi
 * @extends {BaseAPI}
 */
export class RunApi extends BaseAPI {
    /**
     * Returns a single run
     * @summary Get run by ID
     * @param {} runId ID of run to return
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RunApi
     */
    public getRunById(runId: string, options?: any) {
        return RunApiFp(this.configuration).getRunById(runId, options)(this.fetch, this.basePath);
    }

    /**
     *
     * @summary Show all available runs
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof RunApi
     */
    public getRuns(options?: any) {
        return RunApiFp(this.configuration).getRuns(options)(this.fetch, this.basePath);
    }

}

/**
 * ViewApi - fetch parameter creator
 * @export
 */
export const ViewApiFetchParamCreator = function (configuration?: Configuration) {
    return {
        /**
         * Returns a single view
         * @summary Get view by ID
         * @param {string} viewId ID of view to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViewById(viewId: string, options: any = {}): FetchArgs {
            // verify required parameter 'viewId' is not null or undefined
            if (viewId === null || viewId === undefined) {
                throw new RequiredError('viewId','Required parameter viewId was null or undefined when calling getViewById.');
            }
            const localVarPath = `/view/{viewId}`
                .replace(`{${"viewId"}}`, encodeURIComponent(String(viewId)));
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
        /**
         *
         * @summary Show all available views
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViews(options: any = {}): FetchArgs {
            const localVarPath = `/views`;
            const localVarUrlObj = url.parse(localVarPath, true);
            const localVarRequestOptions = Object.assign({ method: 'GET' }, options);
            const localVarHeaderParameter = {} as any;
            const localVarQueryParameter = {} as any;

            localVarUrlObj.query = Object.assign({}, localVarUrlObj.query, localVarQueryParameter, options.query);
            // fix override query string Detail: https://stackoverflow.com/a/7517673/1077943
            delete localVarUrlObj.search;
            localVarRequestOptions.headers = Object.assign({}, localVarHeaderParameter, options.headers);

            return {
                url: url.format(localVarUrlObj),
                options: localVarRequestOptions,
            };
        },
    }
};

/**
 * ViewApi - functional programming interface
 * @export
 */
export const ViewApiFp = function(configuration?: Configuration) {
    return {
        /**
         * Returns a single view
         * @summary Get view by ID
         * @param {string} viewId ID of view to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViewById(viewId: string, options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<View> {
            const localVarFetchArgs = ViewApiFetchParamCreator(configuration).getViewById(viewId, options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
        /**
         *
         * @summary Show all available views
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViews(options?: any): (fetch?: FetchAPI, basePath?: string) => Promise<Array<View>> {
            const localVarFetchArgs = ViewApiFetchParamCreator(configuration).getViews(options);
            return (fetch: FetchAPI = portableFetch, basePath: string = BASE_PATH) => {
                return fetch(basePath + localVarFetchArgs.url, localVarFetchArgs.options).then((response) => {
                    if (response.status >= 200 && response.status < 300) {
                        return response.json();
                    } else {
                        throw response;
                    }
                });
            };
        },
    }
};

/**
 * ViewApi - factory interface
 * @export
 */
export const ViewApiFactory = function (configuration?: Configuration, fetch?: FetchAPI, basePath?: string) {
    return {
        /**
         * Returns a single view
         * @summary Get view by ID
         * @param {string} viewId ID of view to return
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViewById(viewId: string, options?: any) {
            return ViewApiFp(configuration).getViewById(viewId, options)(fetch, basePath);
        },
        /**
         *
         * @summary Show all available views
         * @param {*} [options] Override http request option.
         * @throws {RequiredError}
         */
        getViews(options?: any) {
            return ViewApiFp(configuration).getViews(options)(fetch, basePath);
        },
    };
};

/**
 * ViewApi - object-oriented interface
 * @export
 * @class ViewApi
 * @extends {BaseAPI}
 */
export class ViewApi extends BaseAPI {
    /**
     * Returns a single view
     * @summary Get view by ID
     * @param {} viewId ID of view to return
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ViewApi
     */
    public getViewById(viewId: string, options?: any) {
        return ViewApiFp(this.configuration).getViewById(viewId, options)(this.fetch, this.basePath);
    }

    /**
     *
     * @summary Show all available views
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ViewApi
     */
    public getViews(options?: any) {
        return ViewApiFp(this.configuration).getViews(options)(this.fetch, this.basePath);
    }

}

