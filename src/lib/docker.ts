import { execSync } from "child_process";
import { promisify } from "util";
import * as http from "node:http";

export async function getContainersFromCLI() {
  let message = "";
  let command = "docker container ps";
  try {
    message = execSync(command).toString();
    console.log(`Success on command: ${command}`);
  } catch (error) {
    message = "An error occured in output";
    console.log(message);
  }
  let lines = message.split("\n");
  return lines;
}

export async function _internal_getContainersFromSocketPromise() {
  const options = {
    socketPath: "/var/run/docker.sock",
    path: "/containers/json",
  };

  return new Promise((resolve, reject) => {
    const clientRequest = http.request(options, (res) => {
      let data = "";
      res.setEncoding(`utf8`);

      res.on("data", (chunk) => {
        data += chunk;
      });

      // Resolve the promise when the response ends
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(
            new Error(`Request failed with Status Code: ${res.statusCode}`)
          );
        }
      });

      res.on("error", (error) => {
        reject(error);
      });
    });

    // Handle errors in the request itself
    clientRequest.on("error", (error) => {
      reject(error);
    });

    clientRequest.end();
  });
}

export async function getContainersFromSocketPromise() {
  const commandOutput = await _internal_getContainersFromSocketPromise();
  const lines = (commandOutput as string).split("\n");
  return commandOutput;
}
