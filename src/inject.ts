import * as xhook from "xhook";
import { parse } from "query-string";

import IdFactory from "./services/idFactory";
import MessageBus from "./services/messageBus";
import { IEventMessage } from "./interface/message";
import { IMockResponse, ILog } from "./interface/mock";
import { EXTENSION_NAME } from "./constants";

const messageBus = new MessageBus();
const messageIdFactory = new IdFactory();
const logIdFactory = new IdFactory();

window.addEventListener("message", (event) => {
  
  // We only accept messages from ourselves
  if (event.source != window) return;

  const data: IEventMessage = event.data;
  if (data.to !== "HOOK_SCRIPT") return;

  messageBus.dispatch(data.id, data.message);
});

/**
 * Promisify post message from window to window
 * ackRequired, if false, no id will be assigned hence, no method will be added in message
 * message id was not the problem but function in message bus was
 */
const postMessage = (
  message: IEventMessage["message"],
  type: IEventMessage["type"],
  ackRequired
) => {
  const messageId = ackRequired ? messageIdFactory.getId() : null;

  const messageObject: IEventMessage = {
    id: messageId,
    message,
    to: "CONTENT_SCRIPT",
    from: "HOOK_SCRIPT",
    extenstionName: EXTENSION_NAME,
    type,
  };
  window.postMessage(messageObject, "*");

  if (messageId !== null) {
    return new Promise((reslove) => {
      messageBus.addLister(messageId, reslove);
    });
  }
};

const getLog = (
  request: ILog["request"] & {
    bambooMock?: {
      id: number;
    };
  },
  response?: ILog["response"]
): IEventMessage["message"] => {
  const separator = request.url.indexOf("?");
  const url = separator !== -1 ? request.url.substr(0, separator) : request.url;
  const queryParams =
    separator !== -1
      ? JSON.stringify(parse(request.url.substr(separator)))
      : undefined;

  return {
    request: {
      url,
      body: request.body,
      queryParams,
      method: request.method,
    },
    response,
    id: request.bambooMock?.id,
  };
};

xhook.before((request, callback) => {

  const separator = request.url.indexOf("?");
  const url = separator !== -1 ? request.url.substr(0, separator) : request.url;
  const queryParams =
    separator !== -1
      ? JSON.stringify(parse(request.url.substr(separator)))
      : undefined;

  request.bambooMock = {
    id: logIdFactory.getId(),
  };

  const data: IEventMessage["message"] = getLog(request);
  
  postMessage(data, "LOG", false);

  postMessage(data, "QUERY", true)
    .then((data: { mockResponse: IMockResponse }) => {
      if (data && data.mockResponse) {

        const mock = data.mockResponse;
        const finalResponse = {
          status: mock.status,
          text: mock.response ? mock.response : "",
          type: "json",
          headers: {
            "content-type": "application/json; charset=UTF-8",
          },
        };

        if (mock.delay) {
          setTimeout(() => {
            callback(finalResponse);
          }, mock.delay);
        } else {
          callback(finalResponse);
        }
      } else {
        callback();
      }
    })
    .catch(() => {
      console.log("something went wrong!");
    });
});

xhook.after((request, originalResponse) => {

  try {
    if (typeof originalResponse.clone === "function") {
      const response = originalResponse.clone();
      if (typeof response.text === "string") {
        const data: IEventMessage["message"] = getLog(request, {
          status: response.status,
          response: response.text,
        });
        postMessage(data, "LOG", false);
      } else {
        response.text().then((streamedResponse) => {
          const data: IEventMessage["message"] = getLog(request, {
            status: response.status,
            response: streamedResponse,
          });
          postMessage(data, "LOG", false);
        });
      }
    } else {
      const data: IEventMessage["message"] = getLog(request, {
        status: originalResponse.status,
        response:
          typeof originalResponse.text === "string"
            ? originalResponse.text
            : "Cannot parse response, logging libraries can cause this.",
      });
      postMessage(data, "LOG", false);
    }
  } catch (error) {
    const data: IEventMessage["message"] = getLog(request, {
      status: 0,
      response: undefined,
    });
    postMessage(data, "LOG", false);
    console.log("INJECT_ERROR", error);
  }
});
