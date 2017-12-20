###############################################################################
# Caleydo - Visualization for Molecular Biology - http://caleydo.org
# Copyright (c) The Caleydo Team. All rights reserved.
# Licensed under the new BSD license, available at http://caleydo.org/license
###############################################################################

from phovea_server.ns import Namespace
from phovea_server.util import jsonify
import phovea_server.dataset as dataset
import os.path
import datetime
import logging

app = Namespace(__name__)
_log = logging.getLogger(__name__)

@app.route('/<id>', methods=['GET'])
def _hello(id):
  _log.info('soidfjps')
  ds = dataset.get(id)
  return jsonify({
    ## preprocess data
    'message': 'Hello World',
    'ds' : ds.rows()
  })


def create():
  return app
