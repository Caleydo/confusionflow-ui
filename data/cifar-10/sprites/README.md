# CIFAR-10 Training Set Sprites
Each sprite file contains the `10000` training images from the corresponding batch files from [CIFAR-10 python version](https://www.cs.toronto.edu/~kriz/cifar-10-python.tar.gz). The images are arranged in an `100x100` grid.

## Data Layout
The data layout is row-major (i.e. the images are arranged consecutively row-by-row).
If you have a dataset with a total of 9 images (numbered from [0-8]) and you layout them in a 3x3 matrix the images would be arranged like this:

```
*---*---*---*
| 0 | 1 | 2 |
*---*---*---*
| 3 | 4 | 5 |
*---*---*---*
| 6 | 7 | 8 |
*---*---*---*
```

