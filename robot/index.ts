const Gpio = require('../gpio')

const led = new Gpio(19, {mode: Gpio.OUTPUT})
const motor = new Gpio(10, {mode: Gpio.OUTPUT})

let value = 0
setInterval(() => {
  led.write(value)
  value = 1 - value
}, 500)


// let dutyCycle = 0

// setInterval(() => {
//   led.pwmWrite(dutyCycle);

//   dutyCycle += 5;
//   if (dutyCycle > 255) {
//     dutyCycle = 0;
//   }
// }, 200)

// let pulseWidth = 1000
// let increment = 100

// setInterval(() => {
//   motor.servoWrite(pulseWidth)

//   pulseWidth += increment
//   if (pulseWidth >= 2000) {
//     increment = -100
//   } else if (pulseWidth <= 1000) {
//     increment = 100
//   }
// }, 1000)
