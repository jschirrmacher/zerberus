export type RadianAngle = number
export type DegreeAngle = number

const twoPi = 2 * Math.PI

export type Orientation = {
  angle: RadianAngle
  normalized(): Orientation
  degreeAngle(): DegreeAngle
  differenceTo(other: Orientation): Orientation
  add(other: Orientation): Orientation
  isCloseTo(other: Orientation, epsilon: Orientation): boolean
  toString(): string
  [Symbol.toPrimitive](hint: string): string | number
}

export function create(angle: RadianAngle): Orientation {
  function normalize(angle: RadianAngle) {
    const normalized = angle - twoPi * Math.floor(angle / twoPi)
    return normalized > Math.PI ? normalized - twoPi : normalized
  }

  return {
    angle,

    normalized() {
      return create(normalize(this.angle))
    },

    degreeAngle() {
      return (this.angle / Math.PI) * 180
    },

    differenceTo(other) {
      return create(normalize(other.angle - this.angle))
    },

    add(other) {
      return create(normalize(angle + other.angle))
    },

    isCloseTo(other, epsilon) {
      return normalize(Math.abs(angle - other.angle)) <= epsilon.angle
    },

    toString() {
      return `${this.degreeAngle().toFixed(1)}°`
    },

    [Symbol.toPrimitive](hint) {
      const normalized = create(normalize(this.angle))
      if (hint === "number") {
        return normalized.degreeAngle()
      }
      return normalized.toString()
    },
  }
}

export function fromDegrees(angle: DegreeAngle) {
  return create((angle / 180) * Math.PI)
}

export function fromRadian(angle: RadianAngle) {
  return create(angle)
}
