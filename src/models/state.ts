/** Represents the state (watermark) of a SINGLE activity source within one repository */
export interface SourceLastProcessed {
  lastTimestamp: string; // ISO 8601 format
  // lastId?: string; // Optional
}

/** Represents the state (watermarks) of ALL monitored sources WITHIN one repository */
export interface RepositoryLastProcessed {
  [sourceType: string]: SourceLastProcessed | undefined;
}

/** Represents the state (watermarks) of ALL monitored repositories */
export type LastProcessedState = {
  [repoFullName: string]: RepositoryLastProcessed | undefined;
};
