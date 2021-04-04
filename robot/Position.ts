import { TICKS_PER_MM } from "./MotorSet"
import { RadianAngle } from "./Orientation"

export type TickPosition = number
export type MetricPosition = number
export type Ticks = number

export type MetricCoordinates = {
  x: MetricPosition
  y: MetricPosition
}

export type Position = {
  x: Ticks
  y: Ticks
  metricCoordinates(): MetricCoordinates
  angleTo(position: Position): RadianAngle
  distanceTo(position: Position): Ticks
  toString(): string
  normalize(): Position
  magnitude(): number
}

export function create(x: Ticks, y: Ticks): Position {
  return {
    x,
    y,

    metricCoordinates(): MetricCoordinates {
      return {
        x: this.x / TICKS_PER_MM / 1000,
        y: this.y / TICKS_PER_MM / 1000,
      }
    },

    angleTo(position: Position): RadianAngle {
      const dX = position.x - this.x
      const dY = position.y - this.y
      return -Math.atan2(dY, dX)
    },

    distanceTo(position: Position): Ticks {
      const dX = position.x - this.x
      const dY = position.y - this.y
      return Math.sqrt(dX * dX + dY * dY)
    },

    toString(): string {
      return `(${this.x}, ${this.y})`
    },

    magnitude(): number {
      return Math.sqrt(this.x * this.x + this.y * this.y)
    },

    normalize(): Position {
      return create(this.x / this.magnitude(), this.y / this.magnitude())
    },
  }
}

export function meters(m: MetricPosition): TickPosition {
  return m * 1000 * TICKS_PER_MM
}
