#!/usr/bin/env python3
from skimage import io, transform
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
import eventlet
from time import time
from threading import Thread 
import base64
from io import BytesIO
import os

cap = cv2.VideoCapture(0)

print("Initialised camera")

def exit_handler():
    cap.release()

atexit.register(exit_handler)

sio = socketio.Client()

try:
    sio.connect('ws://localhost:10000')
    connected = True
    print("Initialised websocket connection")
except:
    connected = False

server = socketio.Server(cors_allowed_origins='*')
app = socketio.WSGIApp(server)

@server.event
def connect(sid, environ):
    print('connect ', sid)

@server.event
def disconnect(sid):
    print('disconnect ', sid)

t = Thread(target = lambda: eventlet.wsgi.server(eventlet.listen(('', 5000)), app))
t.start()

print("Setup server")

NET = '../class_net.pth'
images = "./pictures/all_images/"
mainImage = "../pictures/camera.jpg"
Path(images).mkdir(parents=True, exist_ok=True)

print("Setup file structure")

net = torch.load(NET)
net.eval() # Set dropout + batch normalization layers
t = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])

print("Loaded net")
counter = 0
while True:
    tstep = time()
    ret, frame = cap.read()
    frame = cv2.flip(frame, 0)
    frame = cv2.flip(frame, 1)
    cv2.imwrite(images + str(counter) + '.jpg', frame)
    os.remove(mainImage)
    os.link(images + str(counter) + '.jpg', mainImage)
    img = io.imread(images + str(counter) + '.jpg')
    counter += 1
    img = transform.resize(img, (72, 128))
    img = t(img).float()
    output = net.forward(img.unsqueeze(0))[0][0]
    if connected:
        sio.emit('camera', {'obstacle': str(output > 0.9)})
#    im_str = cv2.imencode('.jpg', frame)[1].tostring()
#    server.emit('img', {'img':base64.b64encode(im_str)})
    print(output)
    print("Took: " + str(time() - tstep))
    tstep = time()

@sio.event
def my_message(data):
    print('message received with ', data)

@sio.event
def disconnect():
    print('disconnected from server')