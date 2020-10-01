from picamera import PiCamera
from pathlib import Path

root_dir = "./../pictures/test/"
Path(root_dir).mkdir(parents=True, exist_ok=True)

if __name__ == "__main__":
    camera = PiCamera()
    print("Taking a hundred pictures to time how long it takes")
    start = time.time()
    
    for i in range(100):
        camera.capture(root_dir + str(i) + ".png")

    end = time.time()
    print("100 pictures: ", end- start)