from picamera import PiCamera
from image_recognition import classifier_net.Net
from skimage import io, transform
from torchvision import transforms, utils
from time import time

PATH = '../class_net.pth'

root_dir = "../pictures/all_images/"
Path(root_dir).mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    net = Net()
    net.load_state_dict(torch.load(PATH))
    t = transforms.Compose([transforms.ToTensor(), transforms.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5))])
    with PiCamera() as camera:
        camera.start_preview()
        camera.vflip = True
        camera.hflip = True
        camera.exposure_mode = 'night'
        tstep = time()
        try:
            for i, filename in enumerate(camera.capture_continuous(root_dir + '/{counter:04d}.png')):
                img = io.imread(root_dir + '/{counter:04d}.png')
                img = transform.resize(img, (72, 128))
                img = self._transform()(img).float()
                print("Got picture in " + str(time() - tstep))
                tstep = time()
                output = net.forward(img)
                print(output)
                print("Analysed picture in " + str(time() - tstep))
                tstep = time()
        finally:
            camera.stop_preview()