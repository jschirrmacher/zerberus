const Gpio = require('../gpio')

const led = new Gpio(19, {mode: Gpio.OUTPUT})
const motor1 = {
  in1: new Gpio(2, {mode: Gpio.OUTPUT}),
  in2: new Gpio(3, {mode: Gpio.OUTPUT}),
  ena: new Gpio(4, {mode: Gpio.OUTPUT})
}
const motor2 = {
  in1: new Gpio(17, {mode: Gpio.OUTPUT}),
  in2: new Gpio(27, {mode: Gpio.OUTPUT}),
  ena: new Gpio(22, {mode: Gpio.OUTPUT})
}

let value = 0
setInterval(() => {
  led.write(value)
  value = 1 - value
}, 500)

const REVERSE = false

function fullSpeed(motor: typeof motor1, forward = true) {
  motor.in1.write(forward ? 1 : 0)
  motor.in2.write(forward ? 0 : 1)
  motor.ena.write(1)
}

function stop(motor: typeof motor1, float = false) {
  motor.in1.write(float ? 1 : 0)
  motor.in2.write(float ? 1 : 0)
  motor.ena.write(1)
}

async function wait(millseconds: number) {
  return new Promise(resolve => setTimeout(resolve, millseconds))
}

setInterval(async () => {
  fullSpeed(motor1)
  await wait(2000)
  stop(motor1)
  await wait(1000)
  fullSpeed(motor1, REVERSE)
  await wait(2000)
  stop(motor1)
}, 6000)

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
