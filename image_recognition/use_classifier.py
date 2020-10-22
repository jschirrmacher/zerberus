#!/usr/bin/env python

import torch
import torchvision
import torchvision.transforms as transforms
import matplotlib.pyplot as plt
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from classifier_net import Net
import atexit
import cv2
from pathlib import Path
import socketio
from time import time

sio = socketio.Client()

@sio.event
def connect():
    print('connection established')

@sio.event
def my_message(data):
    print('message received with ', data)

@sio.event
def disconnect():
    print('disconnected from server')

sio.connect('ws://localhost:2001')
print("Initialised websocket connection")

NET = '../class_net.pth'
images = "./pictures/all_images/"
Path(images).mkdir(parents=True, exist_ok=True)

print("Setup file structure")

cap = cv2.VideoCapture(0)

def exit_handler():
    cap.release()

atexit.register(exit_handler)

print("Initialised camera")

net = Net()
net.load_state_dict(torch.load(NET))

t = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])

print("Loaded net")


if __name__ == "__main__":
    counter = 0
    while True:
        tstep = time()
        ret, frame = cap.read()
        frame = cv2.flip(frame, 0)
        frame = cv2.flip(frame, 1)
        cv2.imwrite(images + str(counter) + '.png', frame)
        img = io.imread(images + str(counter) + '.png')
        counter += 1
        img = transform.resize(img, (72, 128))
        img = t(img).float()
        output = net.forward(img.unsqueeze(0))[0][0]
        sio.emit(str(output > 0.9))
        print(output)
        print("Took: " + str(time() - tstep))
        tstep = time()