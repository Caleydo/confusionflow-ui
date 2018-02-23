from __future__ import print_function

import shutil
import lmdb
# import numpy as np
import os
import os.path
import pickle

# The setup script checks if this directory (which contains the LMDB files) already exists
dbname = 'lmdb_cifar10_train'


def download_cifar10(root):
  from six.moves import urllib
  import tarfile

  url = 'https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz'
  filename = 'cifar-10-python.tar.gz'

  root = os.path.expanduser(root)
  fpath = os.path.join(root, filename)

  if not os.path.exists(root):
    os.makedirs(root)

  if os.path.isfile(fpath):
    print('CIFAR 10 already downloaded')
  else:
    print('Downloading CIFAR 10 from ' + url + ' to ' + fpath)
    urllib.request.urlretrieve(url, fpath)

  cwd = os.getcwd()
  tar = tarfile.open(fpath, "r:gz")
  os.chdir(root)
  tar.extractall()
  tar.close()
  os.chdir(cwd)
  os.remove(fpath)


def load_cifar_batch(filename, root):
  fpath = os.path.join(root, filename)
  with open(fpath, 'rb') as cifar_batch_pickle:
      # unpickle files and read in as dictionary object
      cifar_batch = pickle.load(cifar_batch_pickle)
  return cifar_batch


def setup_lmdb(root):
  print('Setup CIFAR 10 LMDB ...')
  batches_dir = os.path.join(root, 'cifar-10-batches-py')
  batch_files = [
    'data_batch_1',
    'data_batch_2',
    'data_batch_3',
    'data_batch_4',
    'data_batch_5']

  root = os.path.expanduser(root)
  dbpath = os.path.join(root, dbname)

  map_size = 10 * 30720000
  env = lmdb.open(dbpath, map_size=map_size)

  img_id = 0

  for filename in batch_files:
    batch_data = load_cifar_batch(filename, batches_dir)

    # load and reshape images [N, C, H, W] ... image, channel, height, width
    images = batch_data[b'data'].reshape([-1, 3, 32, 32])
    # reshape to [N, H, W, C] ... image, height, width, channel
    images = images.transpose(0, 2, 3, 1)
    # load labels and filenames for index file

    with env.begin(write=True) as txn:
      for image in images:
        str_id = '{:08}'.format(img_id)
        data = image.tostring()
        txn.put(str_id, data)
        img_id += 1

  shutil.rmtree(batches_dir)

if __name__ == "__main__":
  cwd = os.path.dirname(os.path.realpath(__file__))
  root = os.path.join(cwd, '../images')
  dbpath = os.path.join(root, './' + dbname)

  if not os.path.exists(dbpath):
    print('Generating CIFAR 10 LMDB ...')
    download_cifar10(root)
    setup_lmdb(root)

  else:
    print('CIFAR 10 LMDB already exists. Exit.')
