from __future__ import print_function

import lmdb
# import numpy as np
import os
import os.path
import pickle


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
    print('Cifar10 already downloaded')
  else:
    print('Downloading CIFAR10 from ' + url + ' to ' + fpath)
    urllib.request.urlretrieve(url, fpath)

  cwd = os.getcwd()
  tar = tarfile.open(fpath, "r:gz")
  os.chdir(root)
  tar.extractall()
  tar.close()
  os.chdir(cwd)


def load_cifar_batch(filename, root):
  fpath = os.path.join(root, filename)
  with open(fpath, 'rb') as cifar_batch_pickle:
      # unpickle files and read in as dictionary object
      cifar_batch = pickle.load(cifar_batch_pickle)
  return cifar_batch


def setup_lmdb(root):
  batch_files = [
    'cifar-10-batches-py/data_batch_1',
    'cifar-10-batches-py/data_batch_2',
    'cifar-10-batches-py/data_batch_3',
    'cifar-10-batches-py/data_batch_4',
    'cifar-10-batches-py/data_batch_5']

  root = os.path.expanduser(root)
  dbname = 'lmdb_cifar10_train'
  dbpath = os.path.join(root, dbname)

  map_size = 10 * 30720000
  env = lmdb.open(dbpath, map_size=map_size)

  img_id = 0

  for filename in batch_files:
    batch_data = load_cifar_batch(filename, root)

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


if __name__ == "__main__":
  cwd = os.path.dirname(os.path.realpath(__file__))
  root = os.path.join(cwd, '../images')

  download_cifar10(root)
  setup_lmdb(root)
