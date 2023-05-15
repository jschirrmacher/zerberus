import { Mock, vi } from "vitest"
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

export function createMotorSpies() {
  return {
    setThrottle: vi.fn(),
    accelerate: vi.fn(),
    stop: vi.fn(),
    float: vi.fn(),
    go: vi.fn(),
    releaseBlock: vi.fn(),
    destruct: vi.fn(),
  }
}

export default function (no: number, spies: Record<MotorProp, Mock>): Motor {
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
