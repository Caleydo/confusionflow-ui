/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */

//register all extensions in the registry following the given pattern
module.exports = function(registry) {
  //registry.push('extension-type', 'extension-id', function() { return System.import('./src/extension_impl'); }, {});
  // generator-phovea:begin
  registry.push('malevoView', 'ConfusionMatrix', function() { return System.import('./src/ConfusionMatrix'); }, {
    'name': 'Confusion Matrix'
  });

  registry.push('malevoView', 'DataSetSelector', function() { return System.import('./src/DatasetSelector'); }, {
    'name': 'Data Set Selector'
  });

  registry.push('malevoView', 'TimelineView', function() { return System.import('./src/timeline/TimelineView'); }, {
    'name': 'TimelineView'
  });

  registry.push('malevoView', 'DetailView', function() { return System.import('./src/detail_view/DetailView'); }, {
    'name': 'DetailView'
  });

  registry.push('malevoView', 'DetailChartTab', function() { return System.import('./src/detail_view/DetailChartTab'); }, {
    'name': 'DetailChartTab',
    'isDetailWindow': true,
    'order': 10
  });

  registry.push('malevoView', 'DetailImageTab', function() { return System.import('./src/detail_view/DetailImageTab'); }, {
    'name': 'DetailImageTab',
    'isDetailWindow': true,
    'order': 20
  });

    registry.push('malevoView', 'SoftmaxStampTab', function() { return System.import('./src/detail_view/SoftmaxStampTab'); }, {
    'name': 'SoftmaxStampTab',
    'isDetailWindow': true,
    'order': 30
  });

  // generator-phovea:end
};

