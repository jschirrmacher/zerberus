import { TICKS_PER_MM } from "./Motor"
import { RadianAngle } from "./Orientation"

export type TickPosition = number
export type MetricPosition = number
export type Ticks = number

export type MetricCoordinates = {
  x: MetricPosition,
  y: MetricPosition
}

export type Position = {
  x: Ticks,
  y: Ticks,
  metricCoordinates(): MetricCoordinates,
  angleTo(position: Position): RadianAngle,
  distanceTo(position: Position): Ticks,
  toString(): string,
}

export function create(x: Ticks, y: Ticks): Position {
  return {
    x,
    y,

    metricCoordinates(): MetricCoordinates {
      return {
        x: this.x / TICKS_PER_MM / 1000,
        y: this.y / TICKS_PER_MM / 1000
      }
    },

    angleTo(position: Position): RadianAngle {
      const dX = position.x - this.x
      const dY = position.y - this.y
      if (dY === 0) {
        return dX < 0 ? Math.PI : 0
      } else if (dX < 0) {
        return -Math.atan(dY / dX) - Math.sign(dY) * Math.PI
      }
      return -Math.atan(dY / dX)
    },

    distanceTo(position: Position): Ticks {
      const dX = position.x - this.x
      const dY = position.y - this.y
      return Math.sqrt(dX * dX + dY * dY)
    },

    toString(): string {
      return `(${this.x}, ${this.y})`
    },
  }
}

export function meters(m: MetricPosition): TickPosition {
  return m * 1000 * TICKS_PER_MM
}
