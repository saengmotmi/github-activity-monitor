import type fs from "fs";

/** Basic file system operations interface */
export interface IFileSystem {
  existsSync(path: string | Buffer | URL): boolean;
  readFileSync(
    path: string | Buffer | URL,
    options?: { encoding?: BufferEncoding | null; flag?: string } | BufferEncoding | null
  ): string | Buffer;
  writeFileSync(
    path: string | Buffer | URL,
    data: string | NodeJS.ArrayBufferView,
    options?: fs.WriteFileOptions
  ): void;
}
