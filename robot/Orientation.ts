export type RadianAngle = number
export type DegreeAngle = number

export type Orientation = {
  angle: RadianAngle,
  degreeAngle(): DegreeAngle,
}

export function create(angle: RadianAngle): Orientation {
  return {
    angle,
    degreeAngle(): DegreeAngle {
      return this.angle / Math.PI * 180
    }
  }
}

export function radians(angle: DegreeAngle): RadianAngle {
  return angle / 180 * Math.PI
}
