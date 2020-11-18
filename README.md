# Racoon chaser

Software for a robot, which chases racoons out of your garden.

It is build using the 4WD Wild Thumper Chassis with 34:1 gear and a Raspberry Pi 4B.

The software consists of several parts:

1. The motor control program which runs the motors is located in `/robot`.
2. A viewer/controller in `/frontend` folder.
3. An image recognition software located in `/image_recognition`.

The robot control program is implmented in TypeScript (for motor control) and Python (for image recognition).

## Installation

### Setup raspberry pi

- Install raspbian 64bit OS (https://downloads.raspberrypi.org/raspios_arm64/images/raspios_arm64-2020-08-24/)
- Follow https://mathinf.eu/pytorch/arm64/
- Configure https://www.piwheels.org/
- Enable camera using `sudo raspi-config`
- curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -
- sudo apt-get install -y libssl-dev caca-utils gfortran liblapack-dev libblas-dev nodejs
- sudo pip3 install scikit-build
- sudo pip3 install opencv-python
- sudo pip3 install scikit-image

### Install robot software

Then, install the robot software:

    git clone https://github.com/jschirrmacher/coon-chaser.git
    cd coon-chaser
    npm i  // for production (on a Rasperry Pi), add `--production`

## Start

If you just want to test the motor control software on your local computer without actual motors connected, you can call

    npm run simulator

To run the production version which uses the actual GPIO of the Raspi, run:

    sudo npm start

You need 'sudo' here to make sure that the program has access to the hardware.

### Start the viewer / controller

To view the current state of the car, open http://localhost:10000 or use the IP address or host name of your Raspi instead of 'localhost', if you started the motor control software there.
To send commands to the car, press the buttons displayed right of the car visualization area.

### Start the edge detection

On the raspberry pi to start the python script to prevent the robot from running into walls, run `python3 use_classifier.py` in the coon_chaser directory on the raspberry pi.

## Car Control

From the web frontend, you can control the car in different ways, either with manual control (pressing arrow keys and space bar to break), or by pressing some of the screen buttons running pre-defined programs (not all of them working as expected yet - remember this work is still in progress).

## Parts list

- Wild Thumper (Chassis and Motors)
- Raspberry PI 4B
- Motor Driver
- Accumulator for Motors
- Accumulator for Raspi
- Night Vision Camera
