import fs from "fs"
import { resolve } from "path"
import { RouteFormatter } from "./CSVFormatter"
import { DataType } from "./RouteTracker"

export default function FileWriter(dir: string, fileName: string, formatter: RouteFormatter) {
  fs.mkdirSync(dir, { recursive: true })
  const file = fs.createWriteStream(resolve(dir, fileName + "." + formatter.extension), { flags: "a" })
  console.log("Writing data to " + dir + "/" + fileName + "." + formatter.extension)
  file.write(formatter.start())

  return {
    async write(timestamp: number, type: DataType, value: unknown): Promise<void> {
      file.write(formatter.map(timestamp, type, value))
    },

    end(): void {
      file.write(formatter.end())
      file.end()
      console.log("Logging data to " + dir + "/" + fileName + "." + formatter.extension + " completed.")
    },
  }
}

export type RouteWriter = ReturnType<typeof FileWriter>
