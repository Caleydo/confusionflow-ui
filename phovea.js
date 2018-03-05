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

  registry.push('malevoView', 'Timeline', function() { return System.import('./src/Timeline'); }, {
    'name': 'Timeline'
  });

  registry.push('malevoView', 'DetailView', function() { return System.import('./src/detail_view/DetailView'); }, {
    'name': 'DetailView'
  });


  // generator-phovea:end
};

