import type { Encoder } from "./Encoder"
import ObservableValueFactory from "../lib/ObservableValue"
import { Mock, vi } from "vitest"

enum EncoderProp {
  tick = "tick",
  simulateSpeed = "simulateSpeed",
}

export function createEncoderSpies() {
  return {
    tick: vi.fn(),
    simulateSpeed: vi.fn(),
  }
}

export default function MockEncoderFactory(no: number, spies: Record<EncoderProp, Mock>): Encoder {
  const encoder: Encoder = {
    no,
    simulated: true,
    position: ObservableValueFactory<number>("position", 0),
    speed: ObservableValueFactory<number>("speed", 0),
    handleChunk: () => undefined,

    ...spies,
  }
  return encoder
}
