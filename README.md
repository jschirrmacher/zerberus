# Racoon chaser

Software for a robot, which chases racoons out of your garden.

The robot will be built soon (parts are already ordered) and will be documented here. It contains a Raspberry PI 4B.

For easier development of the software without burning the motors (and load the Respi every time), I decided to create a kind of simulator.

The simulator consists of several parts:

1. A gpio.ts module, which provides the Gpio class in production mode (NODE_ENV=production), and a simulator class in all other environments.
2. The GpioSimulator class, which sends information to a http server
3. A http server, which sends received information to the frontend
4. A html frontend to receive and visualize this data

The connection between frontend end and http server is implemented via socket.io, so communication might be bidirectional, which allows for simulating sensors as well.

## Installation

Install node.js, if not already installed:

    curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -

Then, install the robot software:

    git clone https://github.com/jschirrmacher/coon-chaser.git
    cd coon-chaser
    npm i  // for production, add `--production`

## Start simulator

To run the simulator software type this command:

    npm run start-dev

Then, start a browser and open http://localhost:10000

## Start production

To run the production version which doesn't use the simulator, but the actual GPIO run:

    npm start

## Try simulator

You can try the simulator by calling it's REST API like this (in a separate browser tab), for example by switching on and off the RX0 pin:

    http://localhost:10000/gpio/RX0/1

and

    http://localhost:10000/gpio/RX0/0
