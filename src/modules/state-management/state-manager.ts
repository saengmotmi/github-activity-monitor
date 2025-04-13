import fs from "fs";
import { AppConfig } from "../../configs/app-config";
import { ActivityItem } from "../../models/activity";
import { LastProcessedState } from "../../models/state";

/** Manages the persistence of the application state (last processed points) */
export interface IStateManager {
  loadState(): LastProcessedState;
  saveState(state: LastProcessedState): void;
  calculateNextState(
    currentState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState;
}

export class JsonStateManager implements IStateManager {
  public constructor(private readonly config: AppConfig) {}

  public loadState(): LastProcessedState {
    if (!fs.existsSync(this.config.stateFilePath)) {
      console.log("State file not found, returning initial state.");
      return {};
    }
    try {
      const data = fs.readFileSync(this.config.stateFilePath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading state file, returning initial state:", error);
      return {};
    }
  }

  public saveState(state: LastProcessedState): void {
    try {
      const data = JSON.stringify(state, null, 2);
      fs.writeFileSync(this.config.stateFilePath, data, "utf-8");
      console.log(`State saved successfully to ${this.config.stateFilePath}`);
    } catch (error) {
      console.error("Error saving state file:", error);
    }
  }

  public calculateNextState(
    currentState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState {
    // Deep clone the current state to avoid modifying the original object directly
    const nextState: LastProcessedState = JSON.parse(JSON.stringify(currentState));

    for (const activity of fetchedActivities) {
      const repoState = (nextState[activity.repo] = nextState[activity.repo] || {});

      // Use the activity's original source type directly
      const stateUpdateType = activity.sourceType;

      const currentItemState = repoState[stateUpdateType];
      const newTimestamp = activity.createdAt;

      if (!currentItemState || newTimestamp > currentItemState.lastTimestamp) {
        // Update the state for the effective source type
        repoState[stateUpdateType] = { lastTimestamp: newTimestamp };
        console.log(`Updating state for ${activity.repo} -> ${stateUpdateType}: ${newTimestamp}`);
      }
    }

    return nextState;
  }
}
