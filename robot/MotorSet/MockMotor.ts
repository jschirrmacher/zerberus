import * as sinon from "sinon"
import { Motor, MotorMode } from "./Motor"
import ObservableValueFactory from "../lib/ObservableValue"
import SubjectFactory from "../lib/Subject"

enum MotorProp {
  setThrottle = "setThrottle",
  accelerate = "accelerate",
  stop = "stop",
  float = "float",
  go = "go",
  releaseBlock = "releaseBlock",
  destruct = "destruct",
}

export function createMotorSpies(sandbox: sinon.SinonSandbox) {
  return {
    setThrottle: sandbox.spy(),
    accelerate: sandbox.spy(),
    stop: sandbox.spy(),
    float: sandbox.spy(),
    go: sandbox.spy(),
    releaseBlock: sandbox.spy(),
    destruct: sandbox.spy(),
  }
}

export default function (no: number, spies: Record<MotorProp, sinon.SinonSpy>): Motor {
  const motor: Motor = {
    no,
    throttle: 0,
    currentThrottle: 0,
    mode: ObservableValueFactory("mode", MotorMode.FLOAT),
    position: ObservableValueFactory("position", 0),
    speed: ObservableValueFactory("speed", 0),
    blocked: SubjectFactory<boolean>(`MotorSet #${no} blocked`),

    ...spies,
  }
  return motor
}
