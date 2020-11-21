import { Car } from "./Car";
import { create as createPosition } from './Position'
import { radians, create as createOrientation } from './Orientation'

type CommandFunction = () => void | Promise<void>

export default function (car: Car): Record<string, CommandFunction> {
  return {
    async runLeft() {
      await car.motors.left.accelerate(100)
      await new Promise(resolve => setTimeout(resolve, 200))
    },

    async runRight() {
      await car.motors.right.accelerate(100)
      await new Promise(resolve => setTimeout(resolve, 200))
    },

    async loop() {
      for (let i=0; i < 10; i++) {
        await car.turnRelative(createOrientation(radians(-45)))
        await car.turnRelative(createOrientation(radians(270)))
        await car.turnRelative(createOrientation(radians(-45)))
        await car.turnRelative(createOrientation(radians(180)), true)
      }
    },
  
    async turn() {
      await car.turnRelative(createOrientation(radians(90)))
    },
    
    async turnOnSpot() {
      await car.turnRelative(createOrientation(radians(-90)), true)
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
      for (let i=0; i < 8; i++) {
        await car.go(500, 40)
        // take photo
        await car.go(500, -40)
        await car.turnRelative(createOrientation(radians(-45)), true)
      }
    },
  
    async curve() {
      await car.turnRelative(createOrientation(radians(-90)))
      await car.go(1500, -30)
      await car.turnRelative(createOrientation(radians(90)))
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
      for (let i = 0; i < 3; i += .3) {
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