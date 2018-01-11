###############################################################################
# Caleydo - Visualization for Molecular Biology - http://caleydo.org
# Copyright (c) The Caleydo Team. All rights reserved.
# Licensed under the new BSD license, available at http://caleydo.org/license
###############################################################################

from phovea_server.ns import Namespace
from phovea_server.util import jsonify
import os.path
import datetime
import logging
import phovea_server.dataset as dataset

app = Namespace(__name__)
_log = logging.getLogger(__name__)

@app.route('/epoch/<id>/ratio_bar', methods=['GET'])
def ratio_bar(id):
  try:
    ds1 = dataset.get(id)
    df = ds1.aspandas()
    accuracy = calcAccuracy(df)
  except ValueError as e: #todo handle correctly
    response = jsonify({'message': 'An error occured: ' + e.message})
    response.status_code = 400
    return response

  return jsonify({
    'accuracy': accuracy,
    'ground_truth': df.ground_truth,
    'predicted': df.predicted
  })

def calcAccuracy(df):
  f = lambda acc, val: acc +1 if (val == True) else acc
  classification = (df.ground_truth == df.predicted).tolist()
  if len(df.ground_truth) != len(df.predicted):
    raise ValueError('The dataset format is not correct')
  tp_rate = reduce(f, classification)
  fp_rate = len(classification) - tp_rate
  return [{'type': 'tp', 'value': tp_rate}, {'type': 'fp', 'value': fp_rate}]


def create():
  return app
