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

trainset = BreakDataset.BreakDataset("./data/") # ./image_recognition/data/ 

trainloader = torch.utils.data.DataLoader(trainset, batch_size=1, #todo: suceed with larger batch size
                                          shuffle=True, num_workers=2)

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
criterion = nn.HingeEmbeddingLoss()
optimizer = optim.Adam(net.parameters(), lr=0.001)

for epoch in range(1):  # loop over the dataset multiple times
    running_loss = 0.0
    for i, data in enumerate(trainloader, 0):
        # get the inputs; data is a list of [inputs, labels]
        inputs, labels, _ = data
        # zero the parameter gradients
        optimizer.zero_grad()

        # forward + backward + optimize
        outputs = net(inputs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        # print statistics
        running_loss += loss.item()
        if i % 100 == 0:
            print('[%d, %5d] loss: %.3f' %
                    (epoch + 1, i + 1, running_loss))
    
    print('[%d, %5d] loss: %.3f' %
            (epoch + 1, i + 1, running_loss))
    running_loss = 0.0

print('Finished Training')
PATH = './class_net.pth'
torch.save(net, PATH)
print('Saved')

correct = 0
total = 0
worst = []
with torch.no_grad():
    for data in testloader:
        images, label, name = data
        outputs = net(images)
        predicted = torch.round(outputs.data)
        total += labels.size(0)
        correct += (predicted == label).sum().item()
        if len(worst) < 10:
            worst.append({"img": name, "error" : abs(predicted - label)})
        else:
            error = abs(predicted - label)
            for i in range(10):
                if worst[i]["error"] < error:
                    continue
                elif i != 0:
                    del worst[i - 1]
                    worst.insert(i - 1, {"img": name, "error" : abs(predicted - label)})
                else:
                    break
            else:
                    del worst[9]
                    worst.insert(9, {"img": name, "error" : abs(predicted - label)})

print('Accuracy of the network on the all test images: %d %%' % (
    100 * correct / total))

for bad in worst:
    print("Worst:" + bad["img"] + " Error " + str(bad["error"]))