import { LastProcessedState } from "../../models/state";

export interface IStateManager {
  loadState(): LastProcessedState;
  saveState(state: LastProcessedState): void;
}
