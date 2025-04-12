import { ActivityItem } from "../../models/activity";
import { LastProcessedState } from "../../models/state";

/** Manages the persistence of the application state (last processed points) */
export interface IStateManager {
  loadState(): LastProcessedState;
  saveState(processedState: LastProcessedState): void;
  calculateNextState(
    currentProcessedState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState;
}
