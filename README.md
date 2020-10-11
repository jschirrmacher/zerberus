# Racoon chaser

Software for a robot, which chases racoons out of your garden.

It is build using the 4WD Wild Thumper Chassis with 34:1 and a Raspberry Pi 4B.

For easier development of the software without burning the motors (and load the Respi every time), we created a simple simulator.

The software consists of several parts:

1. A gpio.ts module in the root folder, which provides the Gpio class in production mode (NODE_ENV=production), and a simulator class in all other environments, which communicates with the http server. The simulator class can also be found in this module.
2. The simulator in `/simulator` folder, containing a http server, which sends received information to a frontend via web sockets and receives simulated sensor data in the same way from the frontend.
3. The actual robot control program, using gpio.ts, is located in `/robot`.

The robot control program is implmented in TypeScript (for motor control) and Python (for image recognition).

## Installation

### Setup raspberry pi

- Install raspbian 64bit OS (https://downloads.raspberrypi.org/raspios_arm64/images/raspios_arm64-2020-08-24/)
- Follow https://mathinf.eu/pytorch/arm64/
- Configure https://www.piwheels.org/
- Enable camera using `sudo raspi-config`
- sudo apt-get install libssl-dev
- sudo pip3 install scikit-build
- sudo pip3 install opencv-python
- sudo apt-get install caca-utils
- sudo apt-get install -y gfortran
- sudo apt-get -y install liblapack-dev libblas-dev
- sudo pip3 install scikit-image
- curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -
- sudo apt-get install -y nodejs

### Install robot software

Then, install the robot software:

    git clone https://github.com/jschirrmacher/coon-chaser.git
    cd coon-chaser
    npm i  // for production (on a Rasperry Pi), add `--production`

## Start actual robot

To run the production version which doesn't use the simulator, but the actual GPIO run:

    sudo npm start <sequence-name>

Running `npm start` without a sequence name prints a list of currently available sequences.

## Start in simulator

To run the simulator software type this command:

    sudo npm run simulator:start

Then, start a browser and open http://localhost:10000

You can then run the robot software by calling

    npm run simulator:robot <sequence-name>

### Try simulator via http client

You can try the simulator by calling it's REST API. You can do this, for example, with 'curl':

    curl -X POST http://localhost:10000/gpio/RXD/1
    curl -X POST http://localhost:10000/gpio/RXD/0

If you use Visual Studio code, you can open the file 'tests.http' and click some of the "Send request" links. Try some more, if you like.

### functions supported by the simulator

- Mode: `POST http://localhost:10000/gpio/mode/:pin/:mode` - currently only "IN", "OUT" and "PWM" are supported. This will be shown in the simulator by a greater, less than or tilde sign right beside the pin.
- Write: `POST http://localhost:10000/gpio/:pin/:value` - values can be "0" or "1"
