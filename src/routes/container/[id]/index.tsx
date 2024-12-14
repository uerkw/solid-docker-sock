import { createAsync, type RouteDefinition } from "@solidjs/router";
import { getContainerById } from "~/api/container";
import { useParams } from "@solidjs/router";
import { ErrorBoundary } from "solid-js";

export const route = {
  preload() {},
} satisfies RouteDefinition;

export default function Home() {
  const params = useParams();
  const singleContainer = createAsync(async () => getContainerById(params.id));
  return (
    <ErrorBoundary
      fallback={
        <div>Something went wrong when trying to find that container!</div>
      }
    >
      <main class="w-full p-4 space-y-2">
        <h2 class="font-bold text-3xl">Container by ID</h2>
        <h3 class="font-bold text-xl">GET: Running container by ID</h3>
        <div class="text-left text-lg">
          <pre>{JSON.stringify(singleContainer(), null, 4)}</pre>
        </div>
      </main>
    </ErrorBoundary>
  );
}
