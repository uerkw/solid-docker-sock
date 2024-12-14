import { query } from "@solidjs/router";
import { requestOnSocket } from "~/lib/docker/utils";

// Temp
export const dockerSocketOptions = {
  socketPath: "/var/run/docker.sock",
};

const options = dockerSocketOptions;

export const listAllContainers = query(_listAllContainers, "listAllContainers");

async function _listAllContainers() {
  let listOfContainers = await requestOnSocket(
    options.socketPath,
    "/containers/json"
  );
  return JSON.parse(listOfContainers);
}

export const getContainerById = query((containerId = {}) => {
  return _getContainerById(containerId);
}, "getContainerById");

async function _getContainerById(containerId: string) {
  try {
    let singleContainer = await requestOnSocket(
      options.socketPath,
      `/containers/${containerId}/json`
    );
    return JSON.parse(singleContainer);
  } catch (error) {
    console.log(`Container ID not found for ${containerId}`);
    return {
      error: "Data was not found for that container ID",
    };
  }
}
