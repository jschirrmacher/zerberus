export type RadianAngle = number
export type DegreeAngle = number

export type Orientation = {
  angle: RadianAngle,
  degreeAngle(): DegreeAngle,
  toString(): string,
}

export function create(angle: RadianAngle): Orientation {
  return {
    angle,
    
    degreeAngle(): DegreeAngle {
      return this.angle / Math.PI * 180
    },

    toString(): string {
      return `${this.degreeAngle()}°`
    },
  }
}

export function radians(angle: DegreeAngle): RadianAngle {
  return angle / 180 * Math.PI
}
