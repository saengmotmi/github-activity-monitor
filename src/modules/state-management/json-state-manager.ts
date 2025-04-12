// src/adapters/json-state-manager.ts
import { IFileSystem, IStateManager } from "../../core/interfaces";
import { ActivityItem } from "../../models/activity";
import { LastProcessedState } from "../../models/state";

export class JsonStateManager implements IStateManager {
  private readonly filePath: string;
  private readonly fileSystem: IFileSystem;
  private readonly defaultState: LastProcessedState = {};

  constructor(filePath: string, fileSystem: IFileSystem) {
    this.filePath = filePath;
    this.fileSystem = fileSystem;
    console.log(`JsonStateManager initialized with path: ${this.filePath}`);
  }

  loadState(): LastProcessedState {
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

  saveState(processedState: LastProcessedState): void {
    try {
      const dataToSave = JSON.stringify(processedState, null, 2);
      this.fileSystem.writeFileSync(this.filePath, dataToSave, { encoding: "utf-8" });
      console.log(`State saved successfully to ${this.filePath}.`);
    } catch (error) {
      console.error(`Error saving state file to ${this.filePath}:`, error);
    }
  }

  calculateNextState(
    currentProcessedState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState {
    const nextProcessedState: LastProcessedState = JSON.parse(
      JSON.stringify(currentProcessedState)
    );

    for (const activity of fetchedActivities) {
      const repo = activity.repo;
      const sourceType = activity.sourceType;

      if (!nextProcessedState[repo]) {
        nextProcessedState[repo] = {};
      }
      const currentRepoProcessed = nextProcessedState[repo]!;

      if (!currentRepoProcessed[sourceType]) {
        currentRepoProcessed[sourceType] = { lastTimestamp: new Date(0).toISOString() };
      }
      const currentSourceProcessed = currentRepoProcessed[sourceType]!;
      const activityDate = new Date(activity.createdAt);

      if (activityDate > new Date(currentSourceProcessed.lastTimestamp)) {
        currentSourceProcessed.lastTimestamp = activity.createdAt;
      }
    }
    return nextProcessedState;
  }
}
