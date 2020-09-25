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
