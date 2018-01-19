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


def create():
  return app
