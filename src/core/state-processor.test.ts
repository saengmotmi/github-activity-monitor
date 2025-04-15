import { describe, it, expect, beforeEach } from "vitest";
import { StateProcessor } from "./state-processor";
import { ActivityItem } from "../models/activity";
import { LastProcessedState } from "../models/state";
import { createActivity, createStandardTestActivities } from "../__tests__/test-utils";

describe("StateProcessor", () => {
  let processor: StateProcessor;
  let testActivities: ActivityItem[];

  beforeEach(() => {
    processor = new StateProcessor();
    testActivities = createStandardTestActivities();
  });

  it("should initialize state for new repositories and sources", () => {
    // Arrange
    const emptyState: LastProcessedState = {};

    // Act
    const result = processor.calculateNextState(emptyState, testActivities);

    // Assert
    expect(result).toHaveProperty("owner/repo1.issue.lastTimestamp");
    expect(result).toHaveProperty("owner/repo1.pull_request.lastTimestamp");
    expect(result).toHaveProperty("owner/repo2.issue.lastTimestamp");
    expect(result).toHaveProperty("owner/repo2.discussion.lastTimestamp");
  });

  it("should update timestamps with the latest activity time per repo and source type", () => {
    // Arrange
    const emptyState: LastProcessedState = {};

    // Act
    const result = processor.calculateNextState(emptyState, testActivities);

    // Assert
    expect(result["owner/repo1"]?.issue?.lastTimestamp).toBe("2023-01-02T10:00:00Z"); // Latest issue in repo1
    expect(result["owner/repo1"]?.pull_request?.lastTimestamp).toBe("2023-01-03T10:00:00Z"); // PR in repo1
    expect(result["owner/repo2"]?.issue?.lastTimestamp).toBe("2023-01-04T10:00:00Z"); // Issue in repo2
    expect(result["owner/repo2"]?.discussion?.lastTimestamp).toBe("2023-01-05T10:00:00Z"); // Discussion in repo2
  });

  it("should preserve existing state for sources with no new activities", () => {
    // Arrange
    const existingState: LastProcessedState = {
      "owner/repo1": {
        issue: { lastTimestamp: "2023-01-01T08:00:00Z" },
        discussion: { lastTimestamp: "2023-01-01T09:00:00Z" }, // No new discussion activities for repo1
      },
    };

    // Act
    const result = processor.calculateNextState(existingState, testActivities);

    // Assert
    expect(result["owner/repo1"]?.discussion?.lastTimestamp).toBe("2023-01-01T09:00:00Z"); // Should remain unchanged
  });

  it("should not update timestamps for older activities", () => {
    // Arrange
    const existingState: LastProcessedState = {
      "owner/repo1": {
        issue: { lastTimestamp: "2023-01-10T00:00:00Z" }, // This is newer than any test activity
      },
    };

    // Act
    const result = processor.calculateNextState(existingState, testActivities);

    // Assert
    expect(result["owner/repo1"]?.issue?.lastTimestamp).toBe("2023-01-10T00:00:00Z"); // Should not be updated
  });

  it("should process multiple activities for the same source correctly", () => {
    // Arrange
    const emptyState: LastProcessedState = {};
    const multipleIssues = [
      createActivity({
        id: "10",
        repo: "owner/repo3",
        sourceType: "issue",
        title: "Old Issue",
        createdAt: "2023-01-01T08:00:00Z",
      }),
      createActivity({
        id: "11",
        repo: "owner/repo3",
        sourceType: "issue",
        title: "New Issue",
        createdAt: "2023-01-05T08:00:00Z", // Newer
      }),
      createActivity({
        id: "12",
        repo: "owner/repo3",
        sourceType: "issue",
        title: "Medium Issue",
        createdAt: "2023-01-03T08:00:00Z",
      }),
    ];

    // Act
    const result = processor.calculateNextState(emptyState, multipleIssues);

    // Assert
    expect(result["owner/repo3"]?.issue?.lastTimestamp).toBe("2023-01-05T08:00:00Z"); // Should pick the newest
  });

  it("should handle a mix of new and existing repositories", () => {
    // Arrange
    const existingState: LastProcessedState = {
      "owner/repo1": {
        issue: { lastTimestamp: "2023-01-01T08:00:00Z" },
      },
      // No entry for owner/repo2
    };

    // Act
    const result = processor.calculateNextState(existingState, testActivities);

    // Assert
    expect(result["owner/repo1"]).toBeDefined();
    expect(result["owner/repo2"]).toBeDefined();
    expect(result["owner/repo1"]?.issue?.lastTimestamp).toBe("2023-01-02T10:00:00Z"); // Updated
    expect(result["owner/repo2"]?.issue?.lastTimestamp).toBe("2023-01-04T10:00:00Z"); // New
  });

  it("should perform a deep copy of the state to avoid modifying the original", () => {
    // Arrange
    const originalState: LastProcessedState = {
      "owner/repo1": {
        issue: { lastTimestamp: "2023-01-01T08:00:00Z" },
      },
    };
    const stateCopy = JSON.parse(JSON.stringify(originalState));

    // Act
    processor.calculateNextState(originalState, testActivities);

    // Assert - original state should be unchanged
    expect(originalState).toEqual(stateCopy);
  });
});
