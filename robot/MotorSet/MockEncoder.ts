import sinon from "sinon"
import { Encoder } from "./Encoder"
import ObservableValueFactory from "../lib/ObservableValue"

enum EncoderProp {
  tick = "tick",
  simulateSpeed = "simulateSpeed",
}

export function createEncoderSpies(sandbox: sinon.SinonSandbox) {
  return {
    tick: sandbox.spy(),
    simulateSpeed: sandbox.spy(),
  }
}

export default function MockEncoderFactory(no: number, spies: Record<EncoderProp, sinon.SinonSpy>): Encoder {
  const sandbox = sinon.createSandbox()

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
