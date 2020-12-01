import 'should'
import CarFactory, { Car, Direction, MINIMAL_TURN_ANGLE } from './Car'
import MockMotor from './MockMotor'
import { Motor } from './MotorSet'
import { create as createOrientation } from './Orientation'

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

    it('should set one motor slower than the other when turning while car is in motion', async () => {
      await car.accelerate(50)
      await car.turn(Direction.left)
      leftMotorSet.throttle.should.lessThan(rightMotorSet.throttle)
    })

    it('should run the motors only until reaching a position', async () => {
      await car.go(100, 50)
      leftMotorSet.throttle.should.equal(0)
      rightMotorSet.throttle.should.equal(0)
      leftMotorSet.getPosition().should.be.greaterThanOrEqual(100)
      rightMotorSet.getPosition().should.be.greaterThanOrEqual(100)
    })
  })

  describe('turning relative', () => {
    it('should stop when relative angle is reached', async () => {
      await car.turnRelative(createOrientation(Math.PI / 4))
      Math.abs(car.orientation.degreeAngle() - 45).should.lessThanOrEqual(2)
    })

    it('should stop at relative angle if turning on the spot', async () => {
      await car.turnRelative(createOrientation(-Math.PI * 3 / 4), true)
      Math.abs(car.orientation.degreeAngle() + 135).should.lessThanOrEqual(6)
    })

    it('should not turn if angle is too small', async () => {
      await car.turnRelative(createOrientation(MINIMAL_TURN_ANGLE * .99))
      car.orientation.degreeAngle().should.equal(0)
    })
  })

  describe('turning to an absolute angle', () => {
    it('should stop when angle is reached', async () => {
      await car.turnTo(createOrientation(Math.PI / 4))
      Math.abs(car.orientation.degreeAngle() - 45).should.lessThanOrEqual(4)
    })

    it('should turn left', async () => {
      await car.turnTo(createOrientation(-Math.PI * 3 / 4))
      Math.abs(car.orientation.degreeAngle() + 135).should.lessThanOrEqual(4)
    })

    it('should not turn if angle is too small', async () => {
      await car.turnTo(createOrientation(MINIMAL_TURN_ANGLE * .99))
      car.orientation.degreeAngle().should.equal(0)
    })
  })
})
