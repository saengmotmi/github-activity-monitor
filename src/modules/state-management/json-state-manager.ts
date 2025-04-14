import { LastProcessedState } from "../../models/state";
import { IFileSystem } from "../persistence/file-system";
import { IStateManager } from "./state-manager";

export class JsonStateManager implements IStateManager {
  private readonly defaultState: LastProcessedState = {};

  public constructor(
    private readonly filePath: string,
    private readonly fileSystem: IFileSystem
  ) {
    console.log(`JsonStateManager initialized with path: ${this.filePath}`);
  }

  public loadState(): LastProcessedState {
    try {
      if (this.fileSystem.existsSync(this.filePath)) {
        const data = this.fileSystem.readFileSync(this.filePath, { encoding: "utf-8" });

        if (typeof data === "string") {
          return JSON.parse(data) as LastProcessedState;
        } else {
          console.error("Error loading state file: Read data is not a string.");
        }
      }
      console.log("State file not found, starting with empty state.");
    } catch (error) {
      console.error("Error loading state file, starting with empty state:", error);
    }

    return JSON.parse(JSON.stringify(this.defaultState));
  }

  public saveState(processedState: LastProcessedState): void {
    try {
      const dataToSave = JSON.stringify(processedState, null, 2);
      this.fileSystem.writeFileSync(this.filePath, dataToSave, { encoding: "utf-8" });

      console.log(`State saved successfully to ${this.filePath}.`);
    } catch (error) {
      console.error(`Error saving state file to ${this.filePath}:`, error);
    }
  }
}
