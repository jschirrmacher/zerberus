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
- `pip3 install --upgrade pip setuptools wheel`
- `sudo pip3 install scikit-build`
- `sudo pip3 install opencv-python`
- `sudo pip3 install scikit-image`

### Setup local Wifi network

We use [RaspAP](https://raspap.com/) to have a local Wifi network on the Raspberry Pi, which is available
even when using the car outdoor.

Currently, we don't got the AP-STA-mode working, so that it is possible to have internet access as well, if the car is at home. This will be further investigated.

### Install robot software

As a final step, install the robot software:

    git clone https://github.com/jschirrmacher/zerberus.git
    cd zerberus
    npm i  // for production (on a Rasperry Pi), add `--production`

## Start

To run the production version which uses the actual GPIO and camera of the Raspi, run:

    sudo npm start

You need 'sudo' here to make sure that the program can access the hardware.

### Simulation mode

If you just want to test the motor control software on your local computer without actual motors connected, you can call

    npm run simulator

There are two URLs with different use cases, which can be opened in your browser:

- [http://localhost:10000/remote.html](http://localhost:10000/remote.html) - A remote control, which lets you directly control the car.
- [http://localhost:10000](http://localhost:10000) - this older frontend contains a simple car control via arrow keys and space bar (for breaking) and a lot of information about GPIO state.

The older frontend also listens to the "t" key, which toggles route tracking. Tracked routes currently reside in CSV files on the server in `data/routes`. The name of each CSV file is the unix time stamp, the tracking was started. Each entry starts with the time in millseconds relative to this start time.

### Remote control mode

To control the actual car manually, open `http://<raspberry-address>:10000/remote.html`. You should use this on your smartphone to be more flexible when running the car outdoors. Put it on your home screen
for easier access and to get rid of the browser controls.

## Parts list

- [Wild Thumper (Chassis and Motors)](https://www.pololu.com/product/1566)
- Raspberry PI 4B
- [Motor Driver](https://www.handsontec.com/dataspecs/module/7A-160W%20motor%20control.pdf)
- Accumulator for Motors
- [CHOETECH PD18W Powerbank USB C 10000mAh for Raspi](https://www.choetech.com/product/b622-10000mah-5v-2.4a-portable-power-bank-black.html)
- [Maker Hawk 5MP Night Vision Camera](https://www.amazon.de/gp/product/B071718FDK/)

## Development

If you change anything in `types.ts` (which is shared by server and frontend), be sure to run `npm run build:types` to update the transpiled version as well. The generated `frontend/types.js` file should be committed together with the changed `types.ts`.

### Log output

To get debug log output, use environment variable "DEBUG" and add the names of the components to get debug output for, like in this example:

    export DEBUG=encoder,motorset,car
