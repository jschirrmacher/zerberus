import torch
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from classifier_net import Net

PATH = './class_net.pth'

net = Net()
net.load_state_dict(torch.load(PATH))