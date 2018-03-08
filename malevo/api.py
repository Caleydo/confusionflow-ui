###############################################################################
# Caleydo - Visualization for Molecular Biology - http://caleydo.org
# Copyright (c) The Caleydo Team. All rights reserved.
# Licensed under the new BSD license, available at http://caleydo.org/license
###############################################################################

from __future__ import print_function

from PIL import Image
import lmdb
import numpy as np
import os
import os.path
import math
import sqlite3
import phovea_server.config
from phovea_server.ns import Namespace
from flask import request
from .util import IntListConverter, serve_pil_image
from phovea_server.util import jsonify
import logging
import shutil

app = Namespace(__name__)
app.url_map.converters['integerList'] = IntListConverter

_log = logging.getLogger(__name__)

os.environ['SQLITE_TMPDIR'] = '/tmp'

dataDir = phovea_server.config.get('phovea_server.absoluteDataDir')
_log.info('use data dir: %s', dataDir)

lmdbname = 'malevo_cifar10_lmdb'
lmdbpath = os.path.realpath(os.path.join(dataDir, lmdbname))
_log.info('use lmdb path: %s', lmdbpath)

def initialize_lmdb():
  """
  Move and rename downloaded LMDB files into separate directory to match convention
  TODO To avoid this function the phovea_product.json and build.js should be extended by a `destname` option
  :return:
  """
  data_file = os.path.join(dataDir, 'malevo_cifar10_data.mdb')  # name as defined in `malevo_product/phovea_product.json`
  lock_file = os.path.join(dataDir, 'malevo_cifar10_lock.mdb')  # name as defined in `malevo_product/phovea_product.json`

  if not os.path.exists(lmdbpath):
    os.makedirs(lmdbpath)

  if os.path.isfile(data_file):
    shutil.move(data_file, os.path.join(lmdbpath, 'data.mdb'))

  if os.path.isfile(lock_file):
    shutil.move(lock_file, os.path.join(lmdbpath, 'lock.mdb'))

initialize_lmdb()


@app.route("/confmat/cell/imageIds", methods=['GET'])
def _get_image_ids():
    run_id = request.args.get('runId', 'cifar10_vgg19')
    epoch_id = request.args.get('epochId', 0)
    ground_truth_id = request.args.get('groundTruthId', 0)
    predicted_id = request.args.get('predictedId', 0)
    num_count = request.args.get('numCount', 100)

    query = (run_id, epoch_id, ground_truth_id, predicted_id)

    dbpath = os.path.realpath(os.path.join(dataDir, 'malevo_cifar10_rundata.db'))
    _log.info('rundata.db path: %s', dbpath)

    conn = sqlite3.connect(dbpath)
    c = conn.cursor()
    c.execute("SELECT img_id FROM logs WHERE run_id = ? AND epoch_id = ? AND ground_truth = ? AND predicted = ?", query)
    img_ids_tuples = c.fetchall()[:num_count]
    conn.close()

    return jsonify([img_id[0] for img_id in img_ids_tuples])


# @app.route('/images/imageSprite/<int:runId>/<integerList:imageIds>', methods=['GET'])
# def _get_image_sprite(runId, imageIds):
    # run_id = runId
    # img_ids = imageIds

@app.route('/images/imageSprite', methods=['GET'])
def _get_image_sprite():
    # run_id = request.args.get('runId', '')
    img_ids = request.args.get('imageIds', [])
    img_ids = map(int, img_ids.split(','))

    n_imgs = len(img_ids)

    if len(img_ids) == 0:
      return 'error'

    _log.info('lmdb path: %s', lmdbpath)

    env = lmdb.open(lmdbpath)

    n_w = 10
    n_h = int(math.ceil(n_imgs / float(n_w)))

    width = n_w * 32
    height = n_h * 32

    master = Image.new(mode='RGB', size=(width, height), color=(0, 0, 0))  # fully transparent

    k = 0
    with env.begin() as txn:
        for i in range(0, n_h):
            for j in range(0, n_w):
                if k == n_imgs:
                  break
                str_id = '{:08}'.format(img_ids[k])
                img = Image.fromarray(np.frombuffer(txn.get(str_id), dtype=np.uint8).reshape((32, 32, 3)))
                master.paste(img, (j * 32, i * 32))
                k += 1

    return serve_pil_image(master)


def create():
    return app
