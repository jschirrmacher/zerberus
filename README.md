# Racoon chaser

Software for a robot, which chases racoons out of your garden.

It is build using the [4WD Wild Thumper Chassis with 34:1 gear](https://www.pololu.com/product/1566) and a Raspberry Pi 4B.

The software consists of several parts:

1. The motor control program which runs the motors is located in `/robot`.
2. A viewer/controller in `/frontend` folder.
3. An image recognition software located in `/image_recognition`.

The robot control program is implmented in TypeScript (for motor control) and Python (for image recognition).

## Installation

### Wire motors, encoders and IMU

THe MPU needs to be connected to the I2C ports, motor controllers and encoders just need some GPIO ports. We wired them like this:

- MPU SDA <-> Raspi SDA (Pin 3)
- MPU SCL <-> Raspi SCL (Pin 5)
- Left Encoder A <-> Raspi GPIO 14 (Pin 8)
- Left Encoder B <-> Raspi GPIO 15 (Pin 10)
- Left Motor IN1 <-> Raspi GPIO 10 (Pin 19)
- Left Motor IN2 <-> Raspi GPIO 9 (Pin 21)
- Left Motor ENA <-> Raspi GPIO 4 (Pin 7)
- Right Encoder A <-> Raspi GPIO 19 (Pin 35)
- Right Encoder B <-> Raspi GPIO 26 (Pin 37)
- Right Motor IN1 <-> Raspi GPIO 17 (Pin 11)
- Right Motor IN2 <-> Raspi GPIO 27 (Pin 13)
- Right Motor ENA <-> Raspi GPIO 22 (Pin 15)

### Setup raspberry pi

- [Download raspbian 64bit OS](https://downloads.raspberrypi.org/raspios_arm64/images/)
- Install on SD Card by using [Rasperry Pi Imager](https://www.raspberrypi.org/software/) with option "Own image"
- Copy `wpa_supplicant.conf.template` file from this repository to SD card, rename it to `wpa_supplicant.conf` and insert your WLAN configuration parameters
- Create an empty `ssh` file on the SD card to enable ssh access
- Put SD card into Raspi and boot, the Raspi should appear in your WLAN after a short while (find out its IP address)
- ssh into Raspi via its IP address, user `pi` password `raspberry`
- Secure account by setting a new password (`passwd`)
- `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | bash`
- Close and re-open your terminal
- `nvm install 18`
- Enable I2C using `sudo raspi-config` (check that device is connected correctly by using `sudo i2cdetect -y 1` - it should show a "68" between a lot of "--")
- Increase I2C baud rate by finding a `dtparam=i2c_arm=on` line in `/boot/config.txt` and replace it to `dtparam=i2c_arm=on,i2c_arm_baudrate=100000`

#### Install image recognition software

- [Follow instructions to us PyTorch](https://mathinf.eu/pytorch/arm64/)
- Configure [PiWheels](https://www.piwheels.org/)
- Enable camera using `sudo raspi-config`
- `sudo apt-get install -y libssl-dev caca-utils gfortran liblapack-dev libblas-dev`
- `sudo apt-get install cmake`
- `sudo apt-get install python3-scipy`
- `sudo pip3 install --upgrade pip setuptools wheel`
- `sudo pip3 install scipy`
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

### Install to run at boot

    sudo cp /home/pi/zerberus/zerberus.service /lib/systemd/system/
    sudo systemctl start zerberus.service 

## Parts list

- [Wild Thumper (Chassis and Motors)](https://www.pololu.com/product/1566)
- Raspberry PI 4B
- [Motor Driver](https://www.handsontec.com/dataspecs/module/7A-160W%20motor%20control.pdf)
- Accumulator for Motors
- [CHOETECH PD18W Powerbank USB C 10000mAh for Raspi](https://www.choetech.com/product/b622-10000mah-5v-2.4a-portable-power-bank-black.html)
- [Maker Hawk 5MP Night Vision Camera](https://www.amazon.de/gp/product/B071718FDK/)
- [IMU with MPU 6050 chip](https://www.conrad.de/de/p/joy-it-mpu6050-beschleunigungs-sensor-1-st-passend-fuer-entwicklungskits-micro-bit-arduino-raspberry-pi-rock-pi-2136256.html)

## Development

If you change anything in `types.ts` (which is shared by server and frontend), be sure to run `npm run build:types` to update the transpiled version as well. The generated `frontend/types.js` file should be committed together with the changed `types.ts`.

### Log output

The log level (`debug`, `info`, `warn` or `error`) can be set via environment variable "LOGLEVEL".

In log level `debug`, another environment variable, "DEBUG" controls, which modules are to be logged. This can be a comma separated list of module names in lower case, like in this example:

    export DEBUG=encoder,motor,car
