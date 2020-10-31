import os
from os import listdir, rename
import torch
import pandas as pd
from skimage import io, transform
import numpy as np
import matplotlib.pyplot as plt
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms, utils

class BreakDataset(Dataset):
    def __init__(self, basedir = "./image_recognition/data/"):
        self.basedir = basedir
        self.break_images =  [f for f in listdir(basedir + "break")]
        self.cont_images =  [f for f in listdir(basedir + "continue")]

    def __len__(self):
        return max(len(self.break_images),len(self.cont_images)) * 2

    def _transform(self):
        return transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])

    def __getitem__(self, idx):
        if torch.is_tensor(idx):
            idx = idx.tolist()
        name = ""
        if idx < max(len(self.break_images),len(self.cont_images)):
            name =  self.break_images[idx % len(self.break_images)]
            sample = {'image': io.imread(self.basedir + "break/" + name ), 'break': 1}
        else:
            name =  self.cont_images[idx % len(self.cont_images)]
            sample = {'image': io.imread(self.basedir + "continue/" + name), 'break': -1}

        sample['image'] = transform.resize(sample['image'], (72, 128))
        sample['image'] = self._transform()(sample['image']).float()
        return [sample['image'], torch.Tensor([sample['break']]).float(), name]

if __name__ == "__main__":
    dataset = BreakDataset()
    for i in range(len(dataset)):
        sample = dataset[i]

        print(i, sample['image'].shape, sample['break'])