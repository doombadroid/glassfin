import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models";
import type { ActiveDownload } from "@/modules";

jest.mock(
  "react-native-mmkv",
  () => jest.requireActual("@/test-utils/mmkv").mmkvModule,
);
jest.mock(
  "expo-file-system",
  () => jest.requireActual("@/test-utils/fileSystem").fileSystemModule,
);
let mockActive: ActiveDownload[] = [];
const mockEnqueue = jest.fn(async (..._args: unknown[]) => 12);
jest.mock("@/modules", () => ({
  BackgroundDownloader: {
    getActiveDownloads: async () => mockActive,
    enqueueDownload: (...args: unknown[]) => mockEnqueue(...args),
    cancelQueuedDownload: jest.fn(),
  },
}));
jest.mock("@/utils/customHeaders", () => ({
  getHeadersForUrl: () => undefined,
}));
jest.mock("@/utils/log", () => ({
  logAndCaptureError: jest.fn(),
  writeToLog: jest.fn(),
}));

import type { PendingDownload } from "../pendingDownloads";
import type { JobStatus } from "../types";

type Launch = {
  rtl: typeof import("@testing-library/react-native/pure");
  pending: typeof import("../pendingDownloads");
  hook: typeof import("./useDownloadReconciliation");
};

/**
 * A fresh app launch. Reconciliation runs once per JS runtime, so every test
 * gets a module registry of its own: the MMKV double, React and the renderer
 * included, which have to come from the same one as the hook. The pure entry
 * point registers no hooks of its own when required inside a test.
 */
let current: Launch | undefined;
const launch = (): Launch => {
  jest.resetModules();
  current = {
    rtl: require("@testing-library/react-native/pure"),
    pending: require("../pendingDownloads"),
    hook: require("./useDownloadReconciliation"),
  };
  return current;
};

const item: BaseItemDto = { Id: "item-1", Name: "Neverland", Type: "Movie" };
const record: PendingDownload = {
  itemId: "item-1",
  status: "downloading",
  enqueuedAt: "2026-10-04T12:00:00.000Z",
  taskId: 7,
  inputUrl: "https://jellyfin.example/Items/item-1/Download",
  videoFileName: "neverland.mp4",
  item,
  mediaSource: {},
  maxBitrate: { key: "Max", value: undefined },
  deviceId: "device",
};

/** Runs the launch's reconciliation and hands back the jobs it put on screen. */
const reconcile = async ({ rtl, hook }: Launch) => {
  let jobs: JobStatus[] = [];
  await rtl.renderHook(() =>
    hook.useDownloadReconciliation({
      setProcesses: (update) => {
        jobs = update(jobs);
      },
    }),
  );
  return () => jobs.map((job) => [job.id, job.status]);
};

beforeEach(() => {
  mockActive = [];
  mockEnqueue.mockClear();
  jest.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(async () => {
  await current?.rtl.cleanup();
  current = undefined;
  jest.restoreAllMocks();
});

describe("download reconciliation at launch", () => {
  // Upstream #1701: a download that was transferring when the app died (an
  // iOS force-quit cancels background transfers, Android kills them with the
  // process) was dropped without a word and vanished from the list.
  test("puts a transfer native lost back in the queue", async () => {
    const app = launch();
    app.pending.savePendingDownload(record);

    const jobs = await reconcile(app);

    await app.rtl.waitFor(() => expect(jobs()).toEqual([["item-1", "queued"]]));
    expect(mockEnqueue).toHaveBeenCalledTimes(1);
    expect(mockEnqueue.mock.calls[0][0]).toBe(record.inputUrl);
    expect(app.pending.getPendingDownload("item-1")?.taskId).toBe(12);
  });

  test("leaves a transfer native still runs alone", async () => {
    const app = launch();
    app.pending.savePendingDownload(record);
    mockActive = [
      { taskId: 7, url: record.inputUrl, state: "running", itemId: "item-1" },
    ];

    const jobs = await reconcile(app);

    await app.rtl.waitFor(() =>
      expect(jobs()).toEqual([["item-1", "downloading"]]),
    );
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  test("drops a record whose file name carries a path", async () => {
    const app = launch();
    app.pending.savePendingDownload({
      ...record,
      videoFileName: "../elsewhere.mp4",
    });

    await reconcile(app);

    await app.rtl.waitFor(() =>
      expect(app.pending.getPendingDownload("item-1")).toBeUndefined(),
    );
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});
