export const fromHex = (n: string) => parseInt(n, 16)
export const toHex = (n: number, length = 2) => ("0".repeat(length) + n.toString(16)).slice(-length)

export function color2rgb(color: string) {
  return color
    .replace(/^#/, "")
    .replace(/(..)/g, "$1,")
    .split(",")
    .filter((n) => n)
    .map(fromHex)
}

export function rgb2color(rgb: number[]) {
  return "#" + rgb.map((n) => toHex(n)).join("")
}

export function adjust(color: string, amount: number) {
  const rgb = color2rgb(color).map((n) => Math.max(0, n + amount))
  return rgb2color(rgb)
}
