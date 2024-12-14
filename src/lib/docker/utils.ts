import * as http from "node:http";
import { Accessor } from "solid-js";

export async function requestOnSocket(
  socketPath: string,
  path: string
): Promise<string> {
  const options = {
    socketPath: socketPath,
    path: path,
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

export async function* requestYieldOnSocket(
  socketPath: string,
  path: string
): AsyncGenerator<string, void, undefined> {
  const options = {
    socketPath: socketPath,
    path: path,
  };

  const clientRequest = http.request(options);

  const response: http.IncomingMessage = await new Promise(
    (resolve, reject) => {
      clientRequest.on("response", (res) => {
        if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
          reject(
            new Error(`Request failed with Status Code: ${res.statusCode}`)
          );
        } else {
          //console.log(res);
          resolve(res);
        }
      });

      clientRequest.on("error", (error) => reject(error));
      clientRequest.end();
    }
  );

  // Stream the response chunks
  for await (const chunk of response) {
    yield chunk.toString();
  }
}
