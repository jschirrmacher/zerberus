# Racoon chaser

Software for a robot, which chases racoons out of your garden.

It is build using the [4WD Wild Thumper Chassis with 34:1 gear](https://www.pololu.com/product/1566) and a Raspberry Pi 4B.

The software consists of several parts:

1. The motor control program which runs the motors is located in `/robot`.
2. A viewer/controller in `/frontend` folder.
3. An image recognition software located in `/image_recognition`.

The robot control program is implmented in TypeScript (for motor control) and Python (for image recognition).

## Installation

### Setup raspberry pi

- [Install raspbian 64bit OS](https://downloads.raspberrypi.org/raspios_arm64/images/raspios_arm64-2020-08-24/)
- [Follow instructions to us PyTorch](https://mathinf.eu/pytorch/arm64/)
- Configure [PiWheels](https://www.piwheels.org/)
- Enable camera using `sudo raspi-config`
- `curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -`
- `sudo apt-get install -y libssl-dev caca-utils gfortran liblapack-dev libblas-dev nodejs`
- `sudo pip3 install scikit-build`
- `sudo pip3 install opencv-python`
- `sudo pip3 install scikit-image`

### Install robot software

Then, install the robot software:

    git clone https://github.com/jschirrmacher/zerberus.git
    cd zerberus
    npm i  // for production (on a Rasperry Pi), add `--production`

## Start

If you just want to test the motor control software on your local computer without actual motors connected, you can call

    npm run simulator

To run the production version which uses the actual GPIO and camera of the Raspi, run:

    sudo npm start

You need 'sudo' here to make sure that the program has access to the hardware.

### Start the viewer / controller

To view the current state of the car, open [http://localhost:10000](http://localhost:10000) or use the IP address or host name of your Raspi instead of 'localhost', if you started the motor control software there.
To send commands to the car, press the buttons displayed right of the car visualization area.

## Car Control

From the web frontend, you can control the car in different ways, either with manual control (pressing arrow keys and space bar to break), or by pressing some of the screen buttons running pre-defined programs.

## Parts list

- [Wild Thumper (Chassis and Motors)](https://www.pololu.com/product/1566)
- Raspberry PI 4B
- [Motor Driver](https://www.handsontec.com/dataspecs/module/7A-160W%20motor%20control.pdf)
- Accumulator for Motors
- [CHOETECH PD18W Powerbank USB C 10000mAh for Raspi](https://www.choetech.com/product/b622-10000mah-5v-2.4a-portable-power-bank-black.html)
- [Maker Hawk 5MP Night Vision Camera](https://www.amazon.de/gp/product/B071718FDK/)

## Development

To get debug log output, use environment variable "DEBUG" and add the names of the components to get debug output for, like in this example:

    export DEBUG=encoder,motorset,car
