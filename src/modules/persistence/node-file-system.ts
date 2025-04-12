import fs, { WriteFileOptions, BufferEncoding } from "fs";
import { IFileSystem } from "./file-system";

export class NodeFileSystem implements IFileSystem {
  existsSync(path: string | Buffer | URL): boolean {
    return fs.existsSync(path);
  }

  readFileSync(
    path: string | Buffer | URL,
    options?: { encoding?: BufferEncoding | null; flag?: string } | BufferEncoding | null
  ): string | Buffer {
    const readOptions = typeof options === "string" ? { encoding: options } : options;
    const finalOptions = readOptions ?? { encoding: "utf-8" };
    if (finalOptions && !finalOptions.encoding) {
      finalOptions.encoding = "utf-8";
    }
    return fs.readFileSync(path, finalOptions);
  }

  writeFileSync(
    path: string | Buffer | URL,
    data: string | NodeJS.ArrayBufferView,
    options?: WriteFileOptions
  ): void {
    const writeOptions = typeof options === "object" ? options : { encoding: options ?? "utf-8" };
    if (typeof data === "string" && (!writeOptions || !writeOptions.encoding)) {
      if (!writeOptions) {
        fs.writeFileSync(path, data, { encoding: "utf-8" });
      } else {
        writeOptions.encoding = "utf-8";
        fs.writeFileSync(path, data, writeOptions);
      }
    } else {
      fs.writeFileSync(path, data, writeOptions);
    }
  }
}
