const Gpio = require('../gpio')

const led = new Gpio(17, {mode: Gpio.OUTPUT})
const motor = new Gpio(10, {mode: Gpio.OUTPUT})

let dutyCycle = 0

setInterval(() => {
  led.pwmWrite(dutyCycle);

  dutyCycle += 5;
  if (dutyCycle > 255) {
    dutyCycle = 0;
  }
}, 20)

let pulseWidth = 1000
let increment = 100

setInterval(() => {
  motor.servoWrite(pulseWidth)

  pulseWidth += increment
  if (pulseWidth >= 2000) {
    increment = -100
  } else if (pulseWidth <= 1000) {
    increment = 100
  }
}, 1000)
