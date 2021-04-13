export type RadianAngle = number
export type DegreeAngle = number

const twoPi = 2 * Math.PI

export type Orientation = {
  angle: RadianAngle
  degreeAngle(): DegreeAngle
  differenceTo(other: Orientation): Orientation
  add(other: Orientation): Orientation
  isCloseTo(other: Orientation, epsilon: Orientation): boolean
  toString(): string
}

export function create(angle: RadianAngle): Orientation {
  function normalizeAngle(angle: number): number {
    const normalize = angle - twoPi * Math.floor(angle / twoPi)
    return normalize > Math.PI ? normalize - twoPi : normalize
  }

  return {
    angle: normalizeAngle(angle),

    degreeAngle(): DegreeAngle {
      return (this.angle / Math.PI) * 180
    },

    differenceTo(other: Orientation): Orientation {
      const diff = other.angle - this.angle
      return create(diff - twoPi * Math.floor((diff + Math.PI) / twoPi))
    },

    add(other: Orientation): Orientation {
      return create(angle + other.angle)
    },

    isCloseTo(other: Orientation, epsilon: Orientation) {
      return Math.abs(angle - other.angle) <= epsilon.angle
    },

    toString(): string {
      return `${this.degreeAngle().toFixed(1)}°`
    },
  }
}

export function fromDegrees(angle: DegreeAngle): Orientation {
  return create((angle / 180) * Math.PI)
}

export function fromRadian(angle: RadianAngle): Orientation {
  return create(angle)
}
