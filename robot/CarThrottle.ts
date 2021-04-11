type JoyStickValues = { x: number; y: number }

export function throttleFromJoystickValues(value: JoyStickValues) {
  const offset = Math.max(value.y + value.x - 100, 0) + Math.min(value.y + value.x + 100, 0)
  const left = value.y + value.x - offset
  const right = value.y - value.x - offset

  return {
    left: left,
    right: right,
  }
}
