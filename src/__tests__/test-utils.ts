import { ActivityItem, ActivitySourceType } from "../models/activity";
import { vi } from "vitest";
import { AppConfig } from "../configs/app-config";
import { IActivitySummarizer } from "../modules/summarization/summarizer";
import { IActivityFetcher } from "../modules/activity-fetching/activity-fetcher";
import { IStateManager } from "../modules/state-management/state-manager";
import { IActivityProcessor } from "../core/activity-processor";
import { IStateProcessor } from "../core/state-processor";
import { INotifier } from "../modules/notification/notifier";
import { LastProcessedState } from "../models/state";

/**
 * 테스트용 활동 아이템 생성 함수
 */
export function createActivity(params: {
  id: string;
  repo: string;
  sourceType: string;
  title: string;
  createdAt: string;
  body?: string;
  author?: string;
  url?: string;
}): ActivityItem {
  return {
    id: params.id,
    repo: params.repo,
    sourceType: params.sourceType as ActivitySourceType,
    title: params.title,
    url: params.url || `https://github.com/${params.repo || ""}/${params.sourceType}s/${params.id}`,
    author: params.author || `user${params.id}`,
    createdAt: params.createdAt,
    body: params.body || `${params.title} body`,
  };
}

/**
 * 표준 테스트 활동 데이터셋 생성
 */
export function createStandardTestActivities(): ActivityItem[] {
  return [
    createActivity({
      id: "1",
      repo: "owner/repo1",
      sourceType: "issue",
      title: "Issue 1",
      createdAt: "2023-01-01T10:00:00Z",
    }),
    createActivity({
      id: "2",
      repo: "owner/repo1",
      sourceType: "issue",
      title: "Issue 2",
      createdAt: "2023-01-02T10:00:00Z",
    }),
    createActivity({
      id: "3",
      repo: "owner/repo1",
      sourceType: "pull_request",
      title: "PR 1",
      createdAt: "2023-01-03T10:00:00Z",
    }),
    createActivity({
      id: "4",
      repo: "owner/repo2",
      sourceType: "issue",
      title: "Issue 1 in repo2",
      createdAt: "2023-01-04T10:00:00Z",
    }),
    createActivity({
      id: "5",
      repo: "owner/repo2",
      sourceType: "discussion",
      title: "Discussion 1 in repo2",
      createdAt: "2023-01-05T10:00:00Z",
    }),
  ];
}

/**
 * 레포지토리 없는 활동 테스트 데이터 생성
 */
export function createActivitiesWithMissingRepo(
  baseActivities: ActivityItem[] = createStandardTestActivities()
): ActivityItem[] {
  return [
    ...baseActivities,
    createActivity({
      id: "6",
      repo: "", // 빈 레포지토리
      sourceType: "issue",
      title: "Invalid Issue",
      createdAt: "2023-01-06T10:00:00Z",
    }),
    {
      id: "7",
      // repo 속성 누락
      sourceType: "issue" as ActivitySourceType,
      title: "Missing Repo Issue",
      url: "https://github.com/issues/7",
      author: "user2",
      createdAt: "2023-01-07T10:00:00Z",
      body: "Missing repo issue body",
    } as ActivityItem,
  ];
}

/**
 * 요약된 활동 생성
 */
export function createSummarizedActivities(activities: ActivityItem[]): ActivityItem[] {
  return activities.map((activity) => ({
    ...activity,
    summary: `Summary of ${activity.title}`,
  }));
}

/**
 * 표준 초기 상태 생성
 */
export function createInitialState(): LastProcessedState {
  return {
    "owner/repo": {
      issue: { lastTimestamp: "2023-01-01T00:00:00Z" },
    },
  };
}

/**
 * 모킹된 요약기 생성
 */
export function createMockSummarizer(failSummarization = false): IActivitySummarizer {
  if (failSummarization) {
    return {
      summarizeActivities: vi.fn().mockRejectedValue(new Error("Summarization failed")),
    };
  }

  return {
    summarizeActivities: vi.fn().mockImplementation((activities) => Promise.resolve(activities)),
  };
}

/**
 * 모킹된 설정 생성
 */
export function createMockConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    maxItemsPerRun: 3,
    summarizationEnabled: false,
    ...overrides,
  } as AppConfig;
}

/**
 * 모킹된 서비스 의존성 생성
 */
export interface MockDependencies {
  fetcher: IActivityFetcher;
  stateManager: IStateManager;
  activityProcessor: IActivityProcessor;
  stateProcessor: IStateProcessor;
  notifier: INotifier;
  summarizer: IActivitySummarizer;
  config: AppConfig;
}

/**
 * 표준 모킹 의존성 생성 (기본값 사용)
 */
export function createMockDependencies(
  options: {
    activities?: ActivityItem[];
    processedActivities?: ActivityItem[];
    initialState?: LastProcessedState;
    nextState?: LastProcessedState;
    summarizationFails?: boolean;
    summarizationEnabled?: boolean;
  } = {}
): MockDependencies {
  const activities = options.activities || createStandardTestActivities();
  const initialState = options.initialState || createInitialState();
  const processedActivities = options.processedActivities || createSummarizedActivities(activities);
  const nextState = options.nextState || {
    "owner/repo": {
      issue: { lastTimestamp: "2023-01-02T00:00:00Z" },
      pull_request: { lastTimestamp: "2023-01-03T00:00:00Z" },
    },
  };

  return {
    fetcher: {
      fetchNewActivities: vi.fn().mockResolvedValue(activities),
    },
    stateManager: {
      loadState: vi.fn().mockReturnValue(initialState),
      saveState: vi.fn(),
    },
    activityProcessor: {
      processForNotification: vi.fn().mockResolvedValue(processedActivities),
    },
    stateProcessor: {
      calculateNextState: vi.fn().mockReturnValue(nextState),
    },
    notifier: {
      sendNotification: vi.fn().mockResolvedValue(undefined),
    },
    summarizer: createMockSummarizer(options.summarizationFails),
    config: createMockConfig({
      summarizationEnabled: options.summarizationEnabled,
    }),
  };
}

/**
 * Silence console output for testing
 */
export function silenceConsoleOutput() {
  return {
    logSpy: vi.spyOn(console, "log").mockImplementation(() => {}),
    warnSpy: vi.spyOn(console, "warn").mockImplementation(() => {}),
    errorSpy: vi.spyOn(console, "error").mockImplementation(() => {}),
  };
}
