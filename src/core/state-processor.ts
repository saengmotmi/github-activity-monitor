import { ActivityItem } from "../models/activity";
import { LastProcessedState, SourceLastProcessed } from "../models/state";

export interface IStateProcessor {
  calculateNextState(
    currentState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState;
}

export class StateProcessor implements IStateProcessor {
  public calculateNextState(
    currentProcessedState: LastProcessedState,
    fetchedActivities: ActivityItem[]
  ): LastProcessedState {
    const nextState = this.initializeNextState(currentProcessedState);

    for (const activity of fetchedActivities) {
      this.processActivity(nextState, activity);
    }

    return nextState;
  }

  private initializeNextState(currentState: LastProcessedState): LastProcessedState {
    // deep copy
    return JSON.parse(JSON.stringify(currentState));
  }

  private processActivity(nextState: LastProcessedState, activity: ActivityItem): void {
    const { repo, sourceType } = activity;

    const sourceState = this.ensureSourceState(nextState, repo, sourceType);
    this.updateLastTimestamp(sourceState, activity.createdAt);
  }

  private ensureSourceState(
    state: LastProcessedState,
    repo: string,
    sourceType: string
  ): SourceLastProcessed {
    if (!state[repo]) {
      state[repo] = {};
    }

    if (!state[repo]?.[sourceType]) {
      state[repo]![sourceType] = { lastTimestamp: new Date(0).toISOString() };
    }

    return state[repo]![sourceType]!;
  }

  private updateLastTimestamp(sourceState: SourceLastProcessed, activityTimestamp: string): void {
    const activityDate = new Date(activityTimestamp);
    const lastProcessedDate = new Date(sourceState.lastTimestamp);

    if (activityDate > lastProcessedDate) {
      sourceState.lastTimestamp = activityTimestamp;
    }
  }
}
