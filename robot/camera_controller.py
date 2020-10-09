import cv2
from image_recognition import classifier_net.Net
from skimage import io, transform
from torchvision import transforms, utils
from time import time
import atexit

def exit_handler():
    cap.release()

atexit.register(exit_handler)

PATH = '../class_net.pth'

root_dir = "../pictures/all_images/"
Path(root_dir).mkdir(parents=True, exist_ok=True)
cap = cv2.VideoCapture(0)

if __name__ == "__main__":
    net = Net()
    net.load_state_dict(torch.load(PATH))
    t = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])
    counter = 0
    while True:
        tstep = time()
        ret, frame = cap.read()
        frame = cv2.flip(frame, 0)
        cv2.imwrite(root_dir + '/{counter:04d}.png', frame)
        img = io.imread(root_dir + '/{counter:04d}.png')
        img = transform.resize(img, (72, 128))
        img = self._transform()(img).float()
        print("Got picture in " + str(time() - tstep))
        tstep = time()
        output = net.forward(img)
        print(output)
        print("Analysed picture in " + str(time() - tstep))
        tstep = time()