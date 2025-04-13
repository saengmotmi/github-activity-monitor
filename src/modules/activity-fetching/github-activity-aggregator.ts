import { ActivityItem, ActivitySourceType } from "../../models/activity";
import { RepoConfig } from "../../models/config";
import { LastProcessedState, RepositoryLastProcessed } from "../../models/state";
import { IActivityFetcher, ISingleSourceActivityFetcher } from "./activity-fetcher";

/**
 * A map of single source activity fetchers.
 * This is used to inject the dependencies into the GithubActivityAggregator constructor.
 */
interface SingleSourceActivityFetchers {
  [key: string]: ISingleSourceActivityFetcher | undefined;
}

export class GithubActivityAggregator implements IActivityFetcher {
  private readonly fetchers = new Map<ActivitySourceType, ISingleSourceActivityFetcher>();

  public constructor(
    private readonly dependencies: SingleSourceActivityFetchers,
    private readonly repoConfigs: RepoConfig[]
  ) {
    const registerFetcher = (fetcher: ISingleSourceActivityFetcher | undefined) => {
      if (fetcher) {
        const types = (
          Array.isArray(fetcher.getSourceType())
            ? fetcher.getSourceType()
            : [fetcher.getSourceType()]
        ) as ActivitySourceType[];

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

  public async fetchNewActivities(
    currentProcessedState: LastProcessedState
  ): Promise<ActivityItem[]> {
    let allNewActivities: ActivityItem[] = [];
    const fetchPromises: Promise<ActivityItem[]>[] = [];

    console.log("Starting aggregated activity fetch...");

    for (const repoConfig of this.repoConfigs) {
      const repoFullName = repoConfig.name;
      const repoLastProcessed: RepositoryLastProcessed = currentProcessedState[repoFullName] || {};
      const fetchersToRun = new Set<ISingleSourceActivityFetcher>();

      for (const typeToMonitor of repoConfig.monitorTypes) {
        const fetcher = this.fetchers.get(typeToMonitor);
        if (fetcher) {
          fetchersToRun.add(fetcher);
        } else {
          console.warn(
            `No registered fetcher found for type "${typeToMonitor}" required by ${repoFullName}`
          );
        }
      }

      for (const fetcher of fetchersToRun) {
        const fetchPromise = (async () => {
          try {
            return await fetcher.fetchNewActivities(repoFullName, repoLastProcessed);
          } catch (error) {
            let fetcherTypesString: string;
            const sourceType = fetcher.getSourceType();
            if (Array.isArray(sourceType)) {
              fetcherTypesString = sourceType.join(", ");
            } else {
              fetcherTypesString = sourceType;
            }
            console.error(
              `Fetcher for type(s) [${fetcherTypesString}] failed unexpectedly for ${repoFullName}:`,
              error
            );
            return [];
          }
        })();
        fetchPromises.push(fetchPromise);
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
}
