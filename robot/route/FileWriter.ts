import fs from "fs"
import { resolve } from "path"
import { ModuleLogger } from "../lib/Logger"
import { RouteFormatter } from "./CSVFormatter"
import { DataType } from "./RouteTracker"

export default function FileWriter(
  dir: string,
  name: string,
  formatter: RouteFormatter,
  logger = ModuleLogger("filewriter")
) {
  fs.mkdirSync(dir, { recursive: true })
  const filePath = resolve(dir, name + "." + formatter.extension)
  const file = fs.createWriteStream(filePath, { flags: "a" })
  logger.debug("Writing data to " + filePath)
  file.write(formatter.start())

  return {
    async write(timestamp: number, type: DataType, value: unknown): Promise<void> {
      file.write(formatter.map(timestamp, type, value))
    },

    end(): void {
      file.write(formatter.end())
      file.end()
      logger.debug("Logging data to " + filePath + " completed.")
    },
  }
}

export type RouteWriter = ReturnType<typeof FileWriter>
