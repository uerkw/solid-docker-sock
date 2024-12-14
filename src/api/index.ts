import { query } from "@solidjs/router";
import {
  getContainersFromCLI,
  getContainersFromSocketPromise,
} from "~/lib/docker";

export const getContainers = query(getContainersFromCLI, "getContainers");

export const getContainersSocket = query(
  getContainersFromSocketPromise,
  "getContainersFromSocket"
);
