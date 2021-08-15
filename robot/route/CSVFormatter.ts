import { DataType } from "./RouteTracker"

export default function CSVFormatter() {
  return {
    extension: "csv",

    start(): string {
      return "timestamp,type,value\n"
    },

    map(time: number, type: DataType, value: unknown): string {
      value = ("" + value).match(/,/) ? `"${value}"` : value
      return +time + "," + type + "," + value + "\n"
    },

    end(): string {
      return ""
    },
  }
}

export type RouteFormatter = ReturnType<typeof CSVFormatter>
