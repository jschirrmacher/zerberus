import { Car, Direction } from "./Car";
import { create as createPosition, meters } from './Position'

export default function (car: Car) {
  return {
    async loop() {
      for (let i=0; i < 10; i++) {
        await car.turn(45, Direction.left, 50)
        await car.turn(270, Direction.right, 50)
        await car.turn(45, Direction.left, 50)
        await car.turn(180, Direction.left, 50, true)
      }
    },
  
    async turn() {
      await car.turn(90, Direction.right, 70)
    },
    
    async turnOnSpot() {
      await car.turn(90, Direction.left, 100, true)
    },
    
    async forward() {
      await car.go(200, 50)
    },
    
    async back() {
      await car.go(200, -50)
    },
  
    async triangle() {
      await car.goto(createPosition(meters(.3), meters(0)))
      await car.goto(createPosition(meters(0), meters(.6)))
      await car.goto(createPosition(meters(-.3), meters(0)))
      await car.goto(createPosition(meters(0), meters(0)))
    },
  
    async star() {
      for (let i=0; i < 8; i++) {
        await car.go(500, 40)
        // take photo
        await car.go(500, -40)
        await car.turn(45, Direction.left, 60, true)
      }
    },
  
    async curve() {
      await car.turn(90, Direction.left, 50)
      await car.go(1500, -30)
      await car.turn(90, Direction.right, 50)
      await car.go(1500, 30)
    },
  
    async square() {
      await car.goto(createPosition(meters(-.5), meters(.5)))
      await car.goto(createPosition(meters(.5), meters(.5)))
      await car.goto(createPosition(meters(.5), meters(-.5)))
      await car.goto(createPosition(meters(-.5), meters(-.5)))
      await car.goto(createPosition(meters(-.5), meters(.5)))
    },
  
    noop() {
    },
  
    stop() {
      car.stop()
    },
  }
}