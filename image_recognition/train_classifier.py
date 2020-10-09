import torch
import torchvision
import torchvision.transforms as transforms
from data import BreakDataset
import matplotlib.pyplot as plt
import numpy as np
import torch.nn as nn
import torch.nn.functional as F
import torch.optim as optim
from classifier_net import Net

trainset = BreakDataset.BreakDataset("./image_recognition/data/")

trainloader = torch.utils.data.DataLoader(trainset, batch_size=1, #todo: suceed with larger batch size
                                          shuffle=True, num_workers=2)


trainloader = torch.utils.data.DataLoader(trainset, batch_size=1,
                                          shuffle=True, num_workers=0)

testloader = torch.utils.data.DataLoader(trainset, batch_size=1, # todo: in future use different data
                                         shuffle=False, num_workers=0)

classes = ('break', 'continue')


def imshow(img):
    img = img / 2 + 0.5     # unnormalize
    npimg = img.numpy()
    plt.imshow(np.transpose(npimg, (1, 2, 0)))
    plt.show()


if False:
    # get some random training images
    dataiter = iter(trainloader)
    images, labels = dataiter.next()
    print(images.shape)
    # show images
    imshow(torchvision.utils.make_grid(images))
    print(' '.join('%5s' % classes[labels[j]] for j in range(4)))

net = Net()
criterion = nn.BCELoss()
optimizer = optim.Adam(net.parameters(), lr=0.001)

for epoch in range(2):  # loop over the dataset multiple times
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):
        # get the inputs; data is a list of [inputs, labels]
        inputs, labels = data
        # zero the parameter gradients
        optimizer.zero_grad()

        # forward + backward + optimize
        outputs = net(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        # print statistics
        running_loss += loss.item()
    
    print('[%d, %5d] loss: %.3f' %
            (epoch + 1, i + 1, running_loss))
    running_loss = 0.0

print('Finished Training')
PATH = './class_net.pth'
torch.save(net.state_dict(), PATH)
print('Saved')
dataiter = iter(testloader)
images, labels = dataiter.next()

correct = 0
total = 0
with torch.no_grad():
    for data in testloader:
        images, labels = data
        outputs = net(images)
        predicted = torch.round(outputs.data)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()

print('Accuracy of the network on the all test images: %d %%' % (
    100 * correct / total))