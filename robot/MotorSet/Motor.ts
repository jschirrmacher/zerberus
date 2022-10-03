import { Encoder, TICKS_PER_REV } from "./Encoder"
import { GPIO, OUTPUT, PWM } from "../Hardware/gpio"
import { Logger, LogLevel } from "../lib/Logger"
import createObservable, { ObservableValue } from "../lib/ObservableValue"
import SubjectFactory, { Subject } from "../lib/Subject"
import TriggerFactory, { waitFor } from "../lib/Trigger"

export const DIAMETER = 120 // mm
export const PERIMETER = DIAMETER * Math.PI
export const TICKS_PER_MM = TICKS_PER_REV / PERIMETER
export const MAX_ACCELERATION = 40
export const MAX_BLOCK_COUNT = 5

export interface Motor {
  no: number
  throttle: number
  currentThrottle: number
  mode: ObservableValue<MotorMode>
  position: ObservableValue<number>
  speed: ObservableValue<number>
  blocked: Subject<boolean>

  setThrottle: (throttle: number) => void

  accelerate: (throttle: number) => Promise<void>
  stop: () => Promise<void>
  float: () => Promise<void>
  releaseBlock(): void

  go(distance: number, throttle: number): Promise<void>

  destruct(): void
}

export enum MotorMode {
  BREAK = "break",
  FLOAT = "float",
  FORWARD = "forward",
  BACKWARDS = "backwards",
}

let motorNo = 1

export function getAdaptedThrottle(desired: number, current: number): number {
  const diff = desired - current
  return current + Math.sign(diff) * Math.min(Math.abs(diff), MAX_ACCELERATION)
}

export default function MotorSetFactory(
  gpio: GPIO,
  pin_in1: number,
  pin_in2: number,
  pin_ena: number,
  encoder: Encoder,
  logger?: Logger
): Motor {
  const in1 = gpio.create(pin_in1, { mode: OUTPUT })
  const in2 = gpio.create(pin_in2, { mode: OUTPUT })
  const ena = gpio.create(pin_ena, { mode: PWM })
  let blockCount = 0
  const blocked = SubjectFactory<boolean>(`MotorSet #${motorNo} blocked`)
  const debugLog = process.env.DEBUG && process.env.DEBUG.split(",").includes("motorset")

  encoder.speed.registerObserver(tick)

  function log(level: LogLevel, msg: string) {
    if (level !== LogLevel.debug || debugLog) {
      ;(logger || console)[level](`Motor,${motor.no},${motor.mode},${motor.currentThrottle.toFixed(0)},${msg}`)
    }
  }

  function tick(speed: number) {
    log(LogLevel.debug, `tick(${speed}): throttle: ${motor.throttle} currentThrottle: ${motor.currentThrottle}`)
    if (blockCount === MAX_BLOCK_COUNT) {
      log(LogLevel.debug, "tick returning since motor is blocked")
      return
    }
    if (motor.throttle && !speed) {
      if (++blockCount === MAX_BLOCK_COUNT) {
        log(LogLevel.warn, `motor is blocked and will be set to FLOAT`)
        motor.throttle = 0
        setMode(motor, MotorMode.FLOAT)
        blocked.notify(true)
        return
      } else {
        log(LogLevel.debug, `motor seems to be blocked #${blockCount}`)
      }
    } else {
      if (blockCount) {
        log(LogLevel.debug, `motor is released automatically`)
      }
      blockCount = 0
    }
    motor.throttle !== motor.currentThrottle && adaptSpeed()
  }

  function setMode(motor: Motor, mode: MotorMode): void {
    log(LogLevel.debug, `Changing mode to ${mode}`)
    in1.digitalWrite(mode === MotorMode.FORWARD || mode === MotorMode.FLOAT ? 1 : 0)
    in2.digitalWrite(mode === MotorMode.BACKWARDS || mode === MotorMode.FLOAT ? 1 : 0)
    motor.mode.value = mode
  }

  function adaptSpeed(): void {
    motor.currentThrottle = getAdaptedThrottle(motor.throttle, motor.currentThrottle)
    const mode = motor.mode.value
    if (mode !== MotorMode.BREAK) {
      if (motor.currentThrottle < 0 && mode !== MotorMode.BACKWARDS) {
        setMode(motor, MotorMode.BACKWARDS)
      } else if (motor.currentThrottle > 0 && mode !== MotorMode.FORWARD) {
        setMode(motor, MotorMode.FORWARD)
      } else if (motor.currentThrottle === 0 && mode !== MotorMode.FLOAT) {
        setMode(motor, MotorMode.FLOAT)
      }
    }
    const pwmValue = Math.max(0, Math.min(255, Math.round(Math.abs(motor.currentThrottle * 2.55))))
    ena.pwmWrite(pwmValue)
    encoder.simulateSpeed(motor.currentThrottle)
  }

  function assertNormalOperation() {
    if (blockCount >= MAX_BLOCK_COUNT) {
      throw Error(`Tried to power blocked motor`)
    }
  }

  const motor = {
    no: motorNo++,
    throttle: 0,
    currentThrottle: 0,
    mode: createObservable("mode", MotorMode.FLOAT),
    position: encoder.position,
    speed: encoder.speed,
    blocked,

    setThrottle(throttle: number) {
      assertNormalOperation()
      motor.throttle = Math.min(Math.abs(throttle), 100) * Math.sign(throttle)
      adaptSpeed()
    },

    async accelerate(throttle: number): Promise<void> {
      const trigger = TriggerFactory()
      trigger.waitFor(encoder.position, () => motor.currentThrottle === motor.throttle)
      trigger.waitFor(motor.blocked)

      motor.setThrottle(throttle)

      await trigger.race()
    },

    async go(distance: number, throttle: number): Promise<void> {
      assertNormalOperation()
      const desiredPosition = encoder.position.value + distance * Math.sign(throttle)
      const direction = Math.sign(desiredPosition - encoder.position.value)

      const trigger = TriggerFactory()
      trigger.waitFor(encoder.position, (pos) => direction * (pos as number) >= desiredPosition * direction)
      trigger.waitFor(motor.blocked)
      motor.throttle = throttle
      await trigger.race()
    },

    async stop(): Promise<void> {
      motor.throttle = 0
      setMode(motor, MotorMode.BREAK)
      await waitFor<number>(encoder.speed, (speed) => speed === 0 && motor.currentThrottle == 0)
      setMode(motor, MotorMode.FLOAT)
    },

    async float(): Promise<void> {
      motor.throttle = 0
      await waitFor<number>(encoder.speed, (speed) => speed === 0)
      adaptSpeed()
    },

    destruct(): void {
      encoder.simulateSpeed(0)
      setMode(motor, MotorMode.FLOAT)
      console.log(`Motor #${motor.no} set to FLOAT`)
      ena.pwmWrite(0)
      console.log(`Motor #${motor.no} set throttle to 0`)
    },

    releaseBlock() {
      log(LogLevel.debug, `Block released`)
      blockCount = 0
    },
  } as Motor

  return motor
}
