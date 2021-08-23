export type ThreeDeeCoords = {
  x: number
  y: number
  z: number
  toString(digits?: number): string
  add(other: ThreeDeeCoords): ThreeDeeCoords
}
export function make3dCoord(x: number = 0, y: number = 0, z: number = 0) {
  const coords: ThreeDeeCoords = {
    x,
    y,
    z,

    toString(digits) {
      if (digits === undefined) {
        return [this.x, this.y, this.z].join(",")
      }
      return [coords.x.toFixed(digits), coords.y.toFixed(digits), coords.z.toFixed(digits)].join(",")
    },

    add(other) {
      return make3dCoord(coords.x + other.x, coords.y + other.y, coords.z + other.z)
    },
  }

  return coords
}
