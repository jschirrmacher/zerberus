import { Car } from "./Car"
import { create as createPosition } from "./Position"
import { fromDegrees } from "./Orientation"

type CommandFunction = (...ags: unknown[]) => void | Promise<void>

export default function (car: Car): Record<string, CommandFunction> {
  return {
    async runLeft() {
      return car.motors.left.accelerate(100)
    },

    async runRight() {
      return car.motors.right.accelerate(100)
    },

    async loop() {
      for (let i = 0; i < 10; i++) {
        await car.accelerate(50)
        await car.turnRelative(fromDegrees(-45))
        await car.turnRelative(fromDegrees(270))
        await car.turnRelative(fromDegrees(-45))
        await car.float()
        await car.turnRelative(fromDegrees(180))
        await car.float()
      }
    },

    async turn() {
      await car.accelerate(50)
      await car.turnRelative(fromDegrees(90))
      await car.float()
    },

    async turnOnSpot() {
      await car.turnRelative(fromDegrees(-90))
    },

    async forward() {
      await car.go(200, 50)
    },

    async back() {
      await car.go(200, -50)
    },

    async triangle() {
      await car.goto(createPosition(0, 0))
      await car.goto(createPosition(300, 0))
      await car.goto(createPosition(0, 600))
      await car.goto(createPosition(-300, 0))
      await car.goto(createPosition(0, 0))
    },

    async star() {
      for (let i = 0; i < 8; i++) {
        await car.go(500, 40)
        // take photo
        await car.go(500, -40)
        await car.accelerate(-40)
        await car.turnRelative(fromDegrees(-45))
      }
    },

    async curve() {
      await car.accelerate(50)
      await car.turnRelative(fromDegrees(-90))
      await car.go(1500, -30)
      await car.accelerate(50)
      await car.turnRelative(fromDegrees(90))
      await car.go(1500, 30)
    },

    async square() {
      await car.goto(createPosition(0, 500))
      await car.goto(createPosition(500, 500))
      await car.goto(createPosition(500, 0))
      await car.goto(createPosition(0, 0))
      await car.goto(createPosition(0, 500))
    },

    async circle() {
      for (let i = 0; i < 3; i += 0.3) {
        const x = 300 * Math.sin(i)
        const y = 300 * Math.cos(i)
        console.log(x, y)
        await car.goto(createPosition(x, y))
      }
    },

    stop() {
      car.stop()
    },

    async backToStart() {
      await car.goto(createPosition(0, 0))
    },
  }
}
