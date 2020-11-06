import 'should'
import * as Position from './Position'

describe('Position', () => {
  const origin = Position.create(0, 0)

  it('can be concatenated with a string', () => {
    ('' + Position.create(4, 4)).should.equal('(4, 4)')
  })

  it('should compute ticks from meters, with 1 revoltion of a 12cm wheel is 544 ticks', () => {
    const pos = Position.meters(.12 * Math.PI)
    pos.should.equal(544)
  })

  it('should calculate the distance to another position', () => {
    const distance = origin.distanceTo(Position.create(4, 4))
    distance.should.equal(Math.sqrt(32))
  })

  describe('angle calculation', () => {
    it('should calculate the angle to another position', () => {
      origin.angleTo(Position.create(4, 4)).should.equal(-Math.PI / 4)
    })

    it('should return -3/4 PI when going to upper left', () => {
      origin.angleTo(Position.create(-4, 4)).should.equal(-3 / 4 * Math.PI)
    })

    it('should return positive values for dY < 0', () => {
      origin.angleTo(Position.create(4, -4)).should.equal(Math.PI / 4)
    })
  
    it('should return 0 when going right', () => {
      origin.angleTo(Position.create(4, 0)).should.equal(0)
    })

    it('should return -PI when going left', () => {
      origin.angleTo(Position.create(-4, 0)).should.equal(-Math.PI)
    })

    it('should return 0 when point is at origin', () => {
      origin.angleTo(Position.create(0, 0)).should.equal(0)
    })

    it('horizontal lines from minus to plus should have an angle of 0', () => {
      Position.create(-4, 4).angleTo(Position.create(4, 4)).should.equal(0)
    })

    it('vertical lines from minus to plus should have an angle of -PI / 2', () => {
      Position.create(4, -4).angleTo(Position.create(4, 4)).should.equal(-Math.PI / 2)
    })

    it('vertical lines from plus to minus should have an angle of PI / 2', () => {
      Position.create(4, 4).angleTo(Position.create(4, -4)).should.equal(Math.PI / 2)
    })

    it('should return 3 / 4 * PI for dX < 0 && dY < 0', () => {
      origin.angleTo(Position.create(-4, -4)).should.equal(Math.PI * 3 / 4)
    })
  })
})
