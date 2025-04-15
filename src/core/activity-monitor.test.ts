import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createInitialState,
  createMockDependencies,
  createStandardTestActivities,
  createSummarizedActivities,
  silenceConsoleOutput,
} from "../__tests__/test-utils";
import { ActivityItem } from "../models/activity";
import { LastProcessedState } from "../models/state";
import { ActivityMonitor } from "./activity-monitor";

describe("ActivityMonitor", () => {
  // Subject under test
  let monitor: ActivityMonitor;

  // Dependencies
  let deps: ReturnType<typeof createMockDependencies>;

  // Test data
  let initialState: LastProcessedState;
  let testActivities: ActivityItem[];
  let processedActivities: ActivityItem[];
  let nextState: LastProcessedState;

  // Console spies
  let consoleSpy: ReturnType<typeof silenceConsoleOutput>;

  beforeEach(() => {
    // Setup test data
    testActivities = createStandardTestActivities();
    initialState = createInitialState();
    processedActivities = createSummarizedActivities(testActivities);
    nextState = {
      "owner/repo": {
        issue: { lastTimestamp: "2023-01-02T00:00:00Z" },
        pull_request: { lastTimestamp: "2023-01-03T00:00:00Z" },
      },
    };

    // Create dependencies with test data
    deps = createMockDependencies({
      activities: testActivities,
      initialState: initialState,
      processedActivities: processedActivities,
      nextState: nextState,
    });

    // Create monitor instance
    monitor = new ActivityMonitor({
      fetcher: deps.fetcher,
      stateManager: deps.stateManager,
      activityProcessor: deps.activityProcessor,
      stateProcessor: deps.stateProcessor,
      notifier: deps.notifier,
    });

    // Silence console output
    consoleSpy = silenceConsoleOutput();
  });

  it("should process activities and update state when new activities exist", async () => {
    // Act
    await monitor.run();

    // Assert - focus on outcomes, not implementation details
    expect(deps.notifier.sendNotification).toHaveBeenCalledWith(processedActivities);
    expect(deps.stateManager.saveState).toHaveBeenCalledWith(nextState);
  });

  it("should not process activities or update state when no new activities exist", async () => {
    // Arrange
    deps.fetcher.fetchNewActivities = vi.fn().mockResolvedValue([]);

    // Act
    await monitor.run();

    // Assert - verify key outcomes
    expect(deps.notifier.sendNotification).not.toHaveBeenCalled();
    expect(deps.stateManager.saveState).not.toHaveBeenCalled();
  });

  it("should log error and not process further when fetching fails", async () => {
    // Arrange
    const testError = new Error("Test fetch error");
    deps.fetcher.fetchNewActivities = vi.fn().mockRejectedValue(testError);

    // Act
    await monitor.run();

    // Assert - verify error was logged and key operation was not performed
    expect(consoleSpy.errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error during ActivityMonitor run:"),
      testError
    );
    expect(deps.notifier.sendNotification).not.toHaveBeenCalled();
  });

  it("should log error and not send notifications when processing fails", async () => {
    // Arrange
    const testError = new Error("Test processing error");
    deps.activityProcessor.processForNotification = vi.fn().mockRejectedValue(testError);

    // Act
    await monitor.run();

    // Assert - verify error was logged and key outcome was not performed
    expect(consoleSpy.errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error during ActivityMonitor run:"),
      testError
    );
    expect(deps.notifier.sendNotification).not.toHaveBeenCalled();
  });

  it("should log error and not update state when notification fails", async () => {
    // Arrange
    const testError = new Error("Test notification error");
    deps.notifier.sendNotification = vi.fn().mockRejectedValue(testError);

    // Act
    await monitor.run();

    // Assert - verify error was logged and key outcome was not performed
    expect(consoleSpy.errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error during ActivityMonitor run:"),
      testError
    );
    expect(deps.stateManager.saveState).not.toHaveBeenCalled();
  });

  afterEach(() => {
    // Restore console spies
    consoleSpy.logSpy.mockRestore();
    consoleSpy.errorSpy.mockRestore();
  });
});
