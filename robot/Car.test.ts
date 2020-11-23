import 'should'
import CarFactory, { Car, Direction } from './Car'
import MockMotor from './MockMotor'
import { Motor } from './MotorSet'

describe('Car', () => {
  let leftMotorSet: Motor
  let rightMotorSet: Motor
  let car: Car

  beforeEach(() => {
    leftMotorSet = MockMotor()
    rightMotorSet = MockMotor()
    car = CarFactory({ left: leftMotorSet, right: rightMotorSet })
  })

  afterEach(() => {
    car.destruct()
  })

  describe('motors', () => {
    it('should both accelerate to the given throttle', async () => {
      await car.accelerate(100)
      leftMotorSet.throttle.should.equal(100)
      rightMotorSet.throttle.should.equal(100)
    })
  
    it('should have a throttle of zero after breaking', async () => {
      await car.accelerate(100)
      await car.stop()
      leftMotorSet.throttle.should.equal(0)
      rightMotorSet.throttle.should.equal(0)
    })
  
    it('should have a throttle of zero after floating', async () => {
      await car.accelerate(100)
      await car.float()
      leftMotorSet.throttle.should.equal(0)
      rightMotorSet.throttle.should.equal(0)
    })

    it('should run motors in different directions if car turns on the spot', async () => {
      await car.turn(Direction.left)
      leftMotorSet.throttle.should.lessThan(0)
      rightMotorSet.throttle.should.greaterThan(0)
    })
  })
})
