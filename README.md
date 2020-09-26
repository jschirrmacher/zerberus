# Racoon chaser

Software for a robot, which chases racoons out of your garden.

The robot will be built soon (parts are already ordered) and will be documented here. It contains a Raspberry PI 4B.

For easier development of the software without burning the motors (and load the Respi every time), I decided to create a kind of simulator.

The simulator consists of several parts:

1. A gpio.ts module in the root folder, which provides the Gpio class in production mode (NODE_ENV=production), and a simulator class in all other environments, which communicates with the http server. The simulator class can also be found in this module.
2. The http server in folder `/server`, which sends received information to the frontend via web sockets and receives simulated sensor data in the same way from the frontend.
3. The html frontend (in `/frontend`) to receive and visualize this data
4. The actual robot control program, using gpio.ts, is located in `/robot`.

## Installation

Install node.js, if not already installed:

    curl -sL https://deb.nodesource.com/setup_12.x | sudo bash -

Then, install the robot software:

    git clone https://github.com/jschirrmacher/coon-chaser.git
    cd coon-chaser
    npm i  // for production (on a Rasperry Pi), add `--production`

## Start simulator

To run the simulator software type this command:

    npm run simulator:start

Then, start a browser and open http://localhost:10000

## Start production

To run the production version which doesn't use the simulator, but the actual GPIO run:

    npm start

## Try simulator via http client

You can try the simulator by calling it's REST API. You can do this, for example, with 'curl':

    curl -X POST http://localhost:10000/gpio/RXD/1
    curl -X POST http://localhost:10000/gpio/RXD/0

If you use Visual Studio code, you can open the file 'tests.http' and click some of the "Send request" links. Try some more, if you like.

## Supported functions

- Mode: `POST http://localhost:10000/gpio/mode/:pin/:mode` - currently only "IN", "OUT" and "PWM" are supported. This will be shown in the simulator by a greater, less than or tilde sign right beside the pin.
- Write: `POST http://localhost:10000/gpio/:pin/:value` - values can be "0" or "1"

## Writing a robot program

Take a look at the `/robot` folder. There you find the current state of our robot control program (not much yet). You can try yourself by executing `npm run simulator:robot`. On an actual Rasperry Pi, you can run `npm start` to let it work with the real GPIO.
