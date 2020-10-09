import cv2
from pathlib import Path
import time
import os

root_dir = "./../pictures/all_images/"
Path(root_dir).mkdir(parents=True, exist_ok=True)

filelist = [ f for f in os.listdir(root_dir) ]
for f in filelist:
    os.remove(os.path.join(root_dir, f))

num = int(input("Number of images to take"))

if __name__ == "__main__":
    cap = cv2.VideoCapture(0)
    print("Taking a " + str(num) + " pictures to time how long it takes")
    start = time.time()
    for i in range(num):
        ret, frame = cap.read()
        frame = cv2.flip(frame, 0)
        frame = cv2.flip(frame, 1)
        cv2.imwrite(root_dir + str(i) + ".png")
        time.sleep(1)
    end = time.time()
    cap.release()
    print(num, " pictures: ", end - start)