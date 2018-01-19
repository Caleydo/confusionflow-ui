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

  registry.push('malevoView', 'DataSetSelector', function() { return System.import('./src/data_set_selector'); }, {
    'name': 'Data Set Selector'
  });

  registry.push('malevoView', 'Timeline', function() { return System.import('./src/timeline'); }, {
    'name': 'Timeline'
  });

  // generator-phovea:end
};

