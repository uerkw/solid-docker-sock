import { createAsync, type RouteDefinition } from "@solidjs/router";
import { listAllContainers } from "~/api/container";

export const route = {
  preload() {},
} satisfies RouteDefinition;

export default function Home() {
  const allContainers = createAsync(async () => listAllContainers());
  return (
    <main class="w-full p-4 space-y-2">
      <h2 class="font-bold text-3xl">Containers List</h2>
      <h3 class="font-bold text-xl">GET: Running containers List</h3>
      <div class="text-left text-lg">
        <pre>{JSON.stringify(allContainers(), null, 4)}</pre>
      </div>
    </main>
  );
}
