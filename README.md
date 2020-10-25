# Racoon chaser

Software for a robot, which chases racoons out of your garden.

It is build using the 4WD Wild Thumper Chassis with 34:1 gear and a Raspberry Pi 4B.

The software consists of several parts:

1. The motor control program which runs the motors is located in `/robot`.
2. A viewer in `/viewer` folder, containing a http server, which sends received information to a frontend via web sockets and receives simulated sensor data in the same way from the frontend.
3. An image recognition software located in `/image_recognition`.
4. A CLI client to send commands to the robot controller

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

### Start the viewer

To view the current state of the car, open http://localhost:10000 or use the IP address or host name of your Raspi instead of 'localhost', if you started the motor control software there.

### Remote control

You can control, what the car should do, by calling node, import a CLI module named 'client' and execute commands for the car like in this example:

    $ node
    > const client = require('./client')
    undefined
    > client.send('curve')
    undefined
    > client.send('getPos')
    undefined
    > {
    type: 'currentPosition',
    pos: { x: 525.991644547528, y: 5.229563255253986 },
    orientation: { angle: 0 }
    }

## Parts list

- Wild Thumper (Chassis and Motors)
- Raspberry PI 4B
- Motor Driver
- Accumulator for Motors
- Accumulator for Raspi
- Night Vision Camera
