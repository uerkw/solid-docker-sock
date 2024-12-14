import { createAsync, type RouteDefinition } from "@solidjs/router";
import { useParams } from "@solidjs/router";
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
import { requestYieldOnSocket } from "~/lib/docker/utils";
import { dockerSocketOptions } from "~/api/container";

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
  const [stopSignal, setStopSignal] = createSignal(false);

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

  async function* fetchData(containerId: string) {
    ("use server");
    const response = requestYieldOnSocket(
      dockerSocketOptions.socketPath,
      `/containers/${containerId}/stats`
    );
    try {
      outerloop: for await (const chunk of response) {
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
      return fetchData(containerId);
    }
  );

  function start() {
    setTrack(true);
  }

  function stop() {
    setStopSignal(true);
    // What should be done here?
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
