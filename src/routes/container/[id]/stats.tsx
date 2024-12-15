import { createAsync, type RouteDefinition } from "@solidjs/router";
import { useParams } from "@solidjs/router";
import { requestYieldOnSocket } from "~/lib/docker/utils";
import { dockerSocketOptions } from "~/api/container";
import { dataStreamRequestCache } from "~/lib/cache";
import { UserDataStreamState } from "~/lib/cache/model";
import {
  Accessor,
  createEffect,
  createResource,
  createSignal,
  ErrorBoundary,
  For,
  onCleanup,
  Resource,
  Suspense,
} from "solid-js";

interface LineIteratorProps {
  source?: AsyncGenerator<string>;
}

function LineIterator(props: LineIteratorProps) {
  const [items, setItems] = createSignal<string[]>([]);

  createEffect(() => {
    const currentSource = props.source!;
    //console.log("source", currentSource);
    if (currentSource) {
      setItems([]);
      (async () => {
        for await (const line of currentSource) {
          //console.log("current", line);
          setItems((current) => [line]);
        }
      })();
    }
  });

  return (
    <For each={items()}>
      {(item) => <pre>{JSON.stringify(JSON.parse(item), null, 4)}</pre>}
    </For>
  );
}

export const route = {
  preload() {},
} satisfies RouteDefinition;

export default function Home() {
  const params = useParams();

  const [track, setTrack] = createSignal();
  const [dataStreamKey, setDataStreamKey] = createSignal("");

  let abortController = new AbortController();
  let abortSignal = abortController.signal;

  async function* processChunks(
    response: AsyncGenerator<string, void, undefined>
  ) {
    if (abortSignal.aborted) {
      let result = await response.next();
      while (!result.done) {
        yield result.value.toString();
        result = await response.next();
      }
    }
  }

  async function setRequestCache(
    isAborted: boolean,
    requestKey?: string
  ): Promise<string> {
    "use server";
    const requestUUID = requestKey ? requestKey : crypto.randomUUID();
    const state: UserDataStreamState = {
      isAborted: isAborted,
      requestKey: requestUUID,
    };
    const updateFn = async () => {
      return state;
    };
    const cacheState = dataStreamRequestCache.getOrCreateCache(
      requestUUID,
      3_600_00,
      updateFn
    );
    const cacheValue = await cacheState.read();
    console.log(cacheValue);
    if (cacheValue) {
      return cacheValue.requestKey;
    } else {
      return "";
    }
  }

  async function* fetchData(containerId: string, requestKey: string) {
    "use server";
    const response = requestYieldOnSocket(
      dockerSocketOptions.socketPath,
      `/containers/${containerId}/stats`
    );
    try {
      outerloop: for await (const chunk of response) {
        const currentCacheValue = await dataStreamRequestCache.read(requestKey);
        const currentAbortStatus = currentCacheValue
          ? currentCacheValue.isAborted
          : false;
        console.log(`Current abort status is ${currentAbortStatus}`);
        if (currentAbortStatus) {
          break outerloop;
        }
        yield chunk.toString();
      }
      // Get the first response
      // let result = await response.next();
      // while (!result.done) {
      //   yield result.value.toString();
      //   result = await response.next();
      // }
    } finally {
      console.log("Generator stopped");
    }
  }

  const [data] = createResource(
    () => (track() ? params.id : undefined),
    (containerId) => {
      return fetchData(containerId, dataStreamKey());
    }
  );

  async function start() {
    const requestKey = await setRequestCache(false);
    setDataStreamKey(requestKey);
    console.log(`STARTED: Data stream key is : ${dataStreamKey()}`);
    setTrack(true);
  }

  async function stop() {
    if (!dataStreamKey()) {
      alert("No data stream currently in progress!");
      return;
    }
    const currentKey = dataStreamKey();
    const requestKey = await setRequestCache(true, currentKey);
    setDataStreamKey(requestKey);
    console.log(`STOPPED: Data stream key is : ${dataStreamKey()}`);
    setTrack(false);
  }

  return (
    <ErrorBoundary
      fallback={
        <div>Something went wrong when trying to find that container!</div>
      }
    >
      <main class="w-full p-4 space-y-2">
        <h2 class="font-bold text-3xl">Container Stats by ID</h2>
        <h3 class="font-bold text-xl">GET: Container Stats by ID</h3>
        <button class="pr-4" type="button" onClick={start}>
          Start
        </button>
        <button type="button" onClick={stop}>
          Stop
        </button>
        <div class="text-left text-lg">
          <Suspense>
            <LineIterator source={data()} />
          </Suspense>
        </div>
      </main>
    </ErrorBoundary>
  );
}
