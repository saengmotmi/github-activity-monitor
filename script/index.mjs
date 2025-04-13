// src/modules/activity-fetching/github-activity-aggregator.ts
var GithubActivityAggregator = class {
  constructor(dependencies, repoConfigs) {
    this.dependencies = dependencies;
    this.repoConfigs = repoConfigs;
    const registerFetcher = (fetcher) => {
      if (fetcher) {
        const types = Array.isArray(fetcher.getSourceType()) ? fetcher.getSourceType() : [fetcher.getSourceType()];
        types.forEach((type) => this.fetchers.set(type, fetcher));
        console.log(`Registered fetcher for type(s): ${types.join(", ")}`);
      }
    };
    Object.values(this.dependencies).forEach(registerFetcher);
    if (this.fetchers.size === 0) {
      console.warn("GithubActivityAggregator initialized without any registered fetchers!");
    }
    console.log(
      `GithubActivityAggregator initialized for ${this.repoConfigs.length} repo configurations.`
    );
  }
  fetchers = /* @__PURE__ */ new Map();
  async fetchNewActivities(currentProcessedState) {
    let allNewActivities = [];
    const fetchPromises = [];
    console.log("Starting aggregated activity fetch...");
    for (const repoConfig of this.repoConfigs) {
      const repoFullName = repoConfig.name;
      const repoLastProcessed = currentProcessedState[repoFullName] || {};
      for (const typeToMonitor of repoConfig.monitorTypes) {
        const fetcher = this.fetchers.get(typeToMonitor);
        console.log(`Fetching ${typeToMonitor} for ${repoFullName}`);
        if (fetcher) {
          const fetchPromise = (async () => {
            try {
              return await fetcher.fetchNewActivities(repoFullName, repoLastProcessed);
            } catch (error) {
              console.error(
                `Fetcher for ${typeToMonitor} failed unexpectedly for ${repoFullName}:`,
                error
              );
              return [];
            }
          })();
          fetchPromises.push(fetchPromise);
        } else {
          console.warn(
            `No registered fetcher found for type "${typeToMonitor}" required by ${repoFullName}`
          );
        }
      }
    }
    const results = await Promise.all(fetchPromises);
    allNewActivities = results.flat();
    allNewActivities.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    console.log(`Aggregated fetch complete. Found ${allNewActivities.length} new activities.`);
    return allNewActivities;
  }
};

// src/modules/persistence/node-file-system.ts
import fs from "fs";
var NodeFileSystem = class {
  existsSync(path) {
    return fs.existsSync(path);
  }
  readFileSync(path, options) {
    const readOptions = typeof options === "string" ? { encoding: options } : options;
    const finalOptions = readOptions ?? { encoding: "utf-8" };
    if (finalOptions && !finalOptions.encoding) {
      finalOptions.encoding = "utf-8";
    }
    return fs.readFileSync(path, finalOptions);
  }
  writeFileSync(path, data, options) {
    const writeOptions = typeof options === "object" ? options : { encoding: options ?? "utf-8" };
    if (typeof data === "string" && (!writeOptions || !writeOptions.encoding)) {
      if (!writeOptions) {
        fs.writeFileSync(path, data, { encoding: "utf-8" });
      } else {
        writeOptions.encoding = "utf-8";
        fs.writeFileSync(path, data, writeOptions);
      }
    } else {
      fs.writeFileSync(path, data, writeOptions);
    }
  }
};

// src/modules/state-management/json-state-manager.ts
var JsonStateManager = class {
  constructor(filePath, fileSystem) {
    this.filePath = filePath;
    this.fileSystem = fileSystem;
    console.log(`JsonStateManager initialized with path: ${this.filePath}`);
  }
  defaultState = {};
  loadState() {
    try {
      if (this.fileSystem.existsSync(this.filePath)) {
        const data = this.fileSystem.readFileSync(this.filePath, { encoding: "utf-8" });
        if (typeof data === "string") {
          return JSON.parse(data);
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
  saveState(processedState) {
    try {
      const dataToSave = JSON.stringify(processedState, null, 2);
      this.fileSystem.writeFileSync(this.filePath, dataToSave, { encoding: "utf-8" });
      console.log(`State saved successfully to ${this.filePath}.`);
    } catch (error) {
      console.error(`Error saving state file to ${this.filePath}:`, error);
    }
  }
  calculateNextState(currentProcessedState, fetchedActivities) {
    const nextProcessedState = JSON.parse(
      JSON.stringify(currentProcessedState)
    );
    for (const activity of fetchedActivities) {
      const repo = activity.repo;
      const sourceType = activity.sourceType;
      if (!nextProcessedState[repo]) {
        nextProcessedState[repo] = {};
      }
      const currentRepoProcessed = nextProcessedState[repo];
      if (!currentRepoProcessed[sourceType]) {
        currentRepoProcessed[sourceType] = { lastTimestamp: (/* @__PURE__ */ new Date(0)).toISOString() };
      }
      const currentSourceProcessed = currentRepoProcessed[sourceType];
      const activityDate = new Date(activity.createdAt);
      if (activityDate > new Date(currentSourceProcessed.lastTimestamp)) {
        currentSourceProcessed.lastTimestamp = activity.createdAt;
      }
    }
    return nextProcessedState;
  }
};

// src/core/activity-monitor.ts
var ActivityMonitor = class {
  constructor(dependencies) {
    this.dependencies = dependencies;
  }
  async run() {
    console.log("ActivityMonitor run starting...");
    try {
      const currentState = this.loadCurrentState();
      const fetchedActivities = await this.fetchNewActivities(currentState);
      if (fetchedActivities.length === 0) {
        console.log("No new activities found. Monitoring run finished.");
        return;
      }
      console.log(`Found ${fetchedActivities.length} new activities.`);
      const itemsToSend = await this.prepareItemsForNotification(fetchedActivities);
      await this.sendNotifications(itemsToSend, fetchedActivities.length);
      this.updateState(currentState, fetchedActivities);
      console.log("ActivityMonitor run finished successfully.");
    } catch (error) {
      console.error("Error during ActivityMonitor run:", error);
    }
  }
  loadCurrentState() {
    return this.dependencies.stateManager.loadState();
  }
  async fetchNewActivities(currentState) {
    return this.dependencies.fetcher.fetchNewActivities(currentState);
  }
  async prepareItemsForNotification(fetchedActivities) {
    const itemsToProcess = fetchedActivities.slice(-this.dependencies.config.maxItemsPerRun);
    if (this.dependencies.config.summarizationEnabled) {
      const summarizedItems = await this.dependencies.summarizer.summarizeActivities(itemsToProcess);
      return summarizedItems;
    }
    return itemsToProcess;
  }
  async sendNotifications(itemsToSend, totalFetchedCount) {
    await this.dependencies.notifier.sendNotification(
      itemsToSend,
      totalFetchedCount,
      this.dependencies.config.maxItemsPerRun
    );
  }
  updateState(currentState, fetchedActivities) {
    const nextState = this.dependencies.stateManager.calculateNextState(
      currentState,
      fetchedActivities
    );
    this.dependencies.stateManager.saveState(nextState);
  }
};

// src/modules/summarization/noop-summarizer.ts
var NoopSummarizer = class {
  async summarizeActivities(activities) {
    console.log("Skipping summarization (NoopSummarizer).");
    return activities;
  }
};

// src/modules/activity-fetching/github-discussion-fetcher.ts
import { graphql, GraphqlResponseError } from "@octokit/graphql";
var DISCUSSION_QUERY = `
    query GetDiscussionsAndComments($owner: String!, $name: String!, $discCount: Int!, $commCount: Int!) {
      repository(owner: $owner, name: $name) {
        discussions(first: $discCount, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            id title url createdAt author { login } bodyText
            comments(last: $commCount, orderBy: {field: UPDATED_AT, direction: DESC}) {
               nodes { id createdAt author { login } bodyText url discussion { title url } }
            }
          }
        }
      }
    }
`;
var GithubDiscussionFetcher = class {
  constructor(config2) {
    this.config = config2;
    this.graphqlWithAuth = graphql.defaults({
      headers: { authorization: `token ${config2.githubPat}` }
    });
    console.log("GithubDiscussionFetcher initialized.");
  }
  graphqlWithAuth;
  getSourceType() {
    return ["discussion", "discussion_comment"];
  }
  processDiscussionData(repoFullName, repositoryData, lastDiscussionTimestamp, lastCommentTimestamp) {
    const activities = [];
    if (!repositoryData?.discussions?.nodes) return activities;
    for (const discussion of repositoryData.discussions.nodes) {
      if (new Date(discussion.createdAt) > new Date(lastDiscussionTimestamp)) {
        activities.push({
          repo: repoFullName,
          sourceType: "discussion",
          id: discussion.id,
          title: discussion.title || "Untitled Discussion",
          url: discussion.url,
          author: discussion.author?.login || "Unknown",
          createdAt: discussion.createdAt,
          body: discussion.bodyText || ""
        });
      }
      if (discussion.comments?.nodes) {
        for (const comment of discussion.comments.nodes) {
          if (new Date(comment.createdAt) > new Date(lastCommentTimestamp)) {
            activities.push({
              repo: repoFullName,
              sourceType: "discussion_comment",
              id: comment.id,
              title: `Re: ${comment.discussion?.title || discussion.title || "Original Discussion"}`,
              url: comment.url,
              author: comment.author?.login || "Unknown",
              createdAt: comment.createdAt,
              body: comment.bodyText || ""
            });
          }
        }
      }
    }
    return activities;
  }
  async fetchNewActivities(repoFullName, repoLastProcessed) {
    const [owner, name] = repoFullName.split("/");
    if (!owner || !name) return [];
    const lastDiscussionTimestamp = repoLastProcessed.discussion?.lastTimestamp || (/* @__PURE__ */ new Date(0)).toISOString();
    const lastCommentTimestamp = repoLastProcessed.comment?.lastTimestamp || (/* @__PURE__ */ new Date(0)).toISOString();
    console.log(
      `Fetching Discussions/Comments for ${repoFullName} since D:${lastDiscussionTimestamp}, C:${lastCommentTimestamp}`
    );
    try {
      const result = await this.graphqlWithAuth(DISCUSSION_QUERY, {
        owner,
        name,
        discCount: this.config.maxItemsPerRun,
        commCount: this.config.maxItemsPerRun
      });
      return this.processDiscussionData(
        repoFullName,
        result.repository,
        lastDiscussionTimestamp,
        lastCommentTimestamp
      );
    } catch (error) {
      if (error instanceof GraphqlResponseError) {
        if (error.message.includes("rate limit exceeded"))
          console.warn(`Rate limit exceeded for ${repoFullName} discussions.`);
        else if (error.errors?.some((e) => e.type === "NOT_FOUND"))
          console.warn(
            `Repo/Discussions not found or insufficient permissions for ${repoFullName}.`
          );
        else
          console.error(
            `GraphQL error fetching discussions for ${repoFullName}:`,
            JSON.stringify(error.errors, null, 2)
          );
      } else if (error instanceof Error)
        console.error(`Network error fetching discussions for ${repoFullName}:`, error.message);
      else console.error(`Unknown error fetching discussions for ${repoFullName}:`, error);
      return [];
    }
  }
};

// src/composition-root.ts
function createActivityFetcher(config2) {
  const discussionFetcher = new GithubDiscussionFetcher(config2);
  return new GithubActivityAggregator(
    {
      discussionFetcher
    },
    config2.repoConfigs
  );
}
function setupApplication(config2) {
  const fileSystem = new NodeFileSystem();
  const stateManager = new JsonStateManager(config2.stateFilePath, fileSystem);
  const summarizer = new NoopSummarizer();
  const fetcher = createActivityFetcher(config2);
  return new ActivityMonitor({
    config: config2,
    fetcher,
    stateManager,
    summarizer,
    notifier: {
      sendNotification: async () => {
        console.log("Notification sent");
      }
    }
  });
}

// src/configs/config-loader.ts
import dotenv from "dotenv";

// src/models/constant.ts
var LLM_PROVIDERS = {
  OPENAI: "openai",
  GEMINI: "gemini",
  CLAUDE: "claude",
  NONE: "none"
};
var LLM_DEFAULT_MODELS = {
  [LLM_PROVIDERS.OPENAI]: "gpt-4o-mini",
  [LLM_PROVIDERS.GEMINI]: "gemini-1.5-flash-latest",
  [LLM_PROVIDERS.CLAUDE]: "claude-3-5-sonnet-20240620",
  [LLM_PROVIDERS.NONE]: ""
};
var DEFAULT_STATE_FILE_PATH = "state.json";
var DEFAULT_MAX_ITEMS_PER_RUN = 5;
var DEFAULT_SUMMARIZATION_ENABLED = false;
var DEFAULT_LLM_PROVIDER = LLM_PROVIDERS.NONE;
var DEFAULT_LLM_MODEL_NAME = "";

// monitor.config.ts
var config = {
  /**
   * Repositories to monitor and the types of activities to track.
   * - `name`: The full repository name (e.g., "owner/repo").
   * - `monitorTypes`: An array of activity types to monitor for this repository.
   *   Supported types: "issue", "issue_comment", "pull_request", "pull_request_review_comment", "discussion", "discussion_comment".
   * @example
   * {
   *   name: "vercel/next.js",
   *   monitorTypes: ["discussion", "discussion_comment", "issue"],
   * }
   */
  repoConfigs: [
    {
      name: "vercel/next.js",
      monitorTypes: ["discussion", "discussion_comment"]
    },
    {
      name: "facebook/react",
      monitorTypes: ["discussion", "discussion_comment"]
    }
  ],
  /**
   * Path to the file where the monitoring state (e.g., last checked timestamp) will be stored.
   * @default "state.json"
   */
  stateFilePath: "state.json",
  /**
   * Maximum number of new items (discussions, issues, etc.) to process in a single run per repository.
   * Helps to avoid hitting API rate limits and manage processing load.
   * @default 5
   */
  maxItemsPerRun: 5,
  /**
   * Whether to enable AI-powered summarization for fetched activities.
   * If set to `true`, requires configuring `llmProvider` and `llmModelName`.
   * @default false
   */
  summarizationEnabled: false,
  /**
   * The Large Language Model (LLM) provider to use for summarization.
   * Required if `summarizationEnabled` is `true`.
   * Supported providers: "gemini", "openai" // (Add other supported providers as needed)
   * @default "none"
   */
  llmProvider: "none",
  // Or "openai", etc.
  /**
   * The specific model name from the selected LLM provider to use for summarization.
   * Required if `summarizationEnabled` is `true`.
   * @example "gemini-1.5-flash-latest", "gpt-4o"
   * @default ""
   */
  llmModelName: ""
  // Or the specific model you intend to use
};

// src/configs/config-loader.ts
dotenv.config();
function loadAndValidateConfig() {
  console.log("Loading and validating application configuration...");
  const secrets = getSecretsFromEnv();
  const variables = getVariablesFromMonitorConfig();
  const appConfig = { ...secrets, ...variables };
  validateAppConfig(appConfig);
  logAppConfig(appConfig);
  console.log("Configuration loading process complete.");
  return appConfig;
}
function getSecretsFromEnv() {
  console.log("Assembling configuration from environment variables...");
  return {
    githubPat: process.env.GITHUB_PAT || "",
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GOOGLE_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY,
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL
  };
}
function getVariablesFromMonitorConfig() {
  return {
    repoConfigs: config.repoConfigs ?? [],
    stateFilePath: config.stateFilePath ?? DEFAULT_STATE_FILE_PATH,
    maxItemsPerRun: config.maxItemsPerRun ?? DEFAULT_MAX_ITEMS_PER_RUN,
    summarizationEnabled: config.summarizationEnabled ?? DEFAULT_SUMMARIZATION_ENABLED,
    llmProvider: config.llmProvider ?? DEFAULT_LLM_PROVIDER,
    llmModelName: config.llmModelName ?? DEFAULT_LLM_MODEL_NAME
  };
}
function validateAppConfig(config2) {
  console.log("Validating configuration...");
  if (config2.githubPat === "") throw new Error("Missing required config: GITHUB_PAT (Secret)");
  if (config2.repoConfigs.length === 0)
    throw new Error("Missing or invalid required config: RepoConfigs");
  if (config2.repoConfigs.some((rc) => rc.name === ""))
    throw new Error("Missing or invalid required config: RepoConfigs.name");
  if (config2.repoConfigs.some((rc) => rc.monitorTypes.length === 0))
    throw new Error("Missing or invalid required config: RepoConfigs.monitorTypes");
  if (!config2.discordWebhookUrl && !config2.slackWebhookUrl) {
    console.warn(
      "Warning: No notifier webhook URL configured (DISCORD_WEBHOOK_URL or SLACK_WEBHOOK_URL). Notifications may fail."
    );
    throw new Error("At least one notifier webhook URL is required.");
  }
  const llmProviderValidation = {
    [LLM_PROVIDERS.OPENAI]: {
      isValid: (cfg) => !!cfg.openaiApiKey,
      errorMessage: "OpenAI summarization requires OPENAI_API_KEY (Secret)"
    },
    [LLM_PROVIDERS.GEMINI]: {
      isValid: (cfg) => !!cfg.geminiApiKey,
      errorMessage: "Gemini summarization requires GOOGLE_API_KEY (Secret)"
    },
    [LLM_PROVIDERS.CLAUDE]: {
      isValid: (cfg) => !!cfg.claudeApiKey,
      errorMessage: "Claude summarization requires CLAUDE_API_KEY (Secret)"
    }
  };
  if (config2.summarizationEnabled) {
    if (config2.llmProvider === LLM_PROVIDERS.NONE) {
      console.warn(
        `Summarization is enabled but LLM_PROVIDER is '${LLM_PROVIDERS.NONE}'. Disabling summarization.`
      );
      config2.summarizationEnabled = false;
    } else {
      if (!config2.llmModelName) {
        console.warn(
          `LLM model name could not be determined for provider: ${config2.llmProvider}. Using default or summarization might fail.`
        );
      }
      const validator = llmProviderValidation[config2.llmProvider];
      if (validator && !validator.isValid(config2)) {
        throw new Error(validator.errorMessage);
      }
    }
  }
}
function logAppConfig(config2) {
  console.log(
    `--- Monitoring Repos --- 
${config2.repoConfigs.map((rc) => `repo: ${rc.name} - types: ${rc.monitorTypes.join(", ")}`).join("\n")}`
  );
  console.log(`State File Path: ${config2.stateFilePath}`);
  if (config2.summarizationEnabled) {
    console.log(
      `Summarization Enabled: ${config2.summarizationEnabled}, Provider: ${config2.llmProvider} - ${config2.llmModelName}`
    );
  }
}

// src/index.ts
async function bootstrap() {
  console.log("Bootstrapping application...");
  try {
    const config2 = loadAndValidateConfig();
    const monitor = setupApplication(config2);
    await monitor.run();
    console.log("Application run finished successfully.");
  } catch (error) {
    console.error("Application failed during setup or run:", error);
    process.exit(1);
  }
}
console.log("Starting application...");
bootstrap();
//# sourceMappingURL=index.mjs.map