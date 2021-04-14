type JoyStickValues = { x: number; y: number }
type MotorThrottles = { left: number; right: number }

function squarePercent(value: number) {
  return Math.sign(value) * Math.round((value / 100) * (value / 100) * 100)
}

export function throttleFromJoystickValues(value: JoyStickValues): MotorThrottles {
  const x = squarePercent(value.x)
  const y = squarePercent(value.y)
  const offset = Math.max(y + x - 100, 0) + Math.min(y + x + 100, 0)

  return {
    left: y + x - offset,
    right: y - x - offset,
  }
}
