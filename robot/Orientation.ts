export type RadianAngle = number
export type DegreeAngle = number

const twoPi = 2 * Math.PI

export type Orientation = {
  angle: RadianAngle,
  degreeAngle(): DegreeAngle,
  differenceTo(other: Orientation): RadianAngle,
  toString(): string,
}

export function create(angle: RadianAngle): Orientation {
  return {
    angle,

    degreeAngle(): DegreeAngle {
      return this.angle / Math.PI * 180
    },

    differenceTo(other: Orientation): RadianAngle {
      const diff = this.angle - other.angle
      return diff - twoPi * Math.floor((diff + Math.PI) / twoPi)
    },

    toString(): string {
      return `${this.degreeAngle()}°`
    },
  }
}

export function radians(angle: DegreeAngle): RadianAngle {
  return angle / 180 * Math.PI
}
