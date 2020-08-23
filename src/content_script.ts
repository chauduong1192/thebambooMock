import { get } from "lodash";

import inject from "./contentScript/injectToDom";
import { IEventMessage } from "./interface/message";
import { getDefaultStore, getURLMap } from "./services/collection";
import { IStore, IMockResponse, IURLMap } from "./interface/mock";
import { DB_NAME, EXTENSION_NAME } from "./constants";

const init = () => {
  let store: IStore;
  let urlMap: IURLMap = {};

  const setStore = () => {
    chrome.storage.local.get([DB_NAME], (result) => {
      store = result[DB_NAME] || getDefaultStore();
      urlMap = getURLMap(store);
    });
  };

  const getMockPath = (url: string, method: string) => {
    if (urlMap[url]) {
      if (urlMap[url][method]) {
        return urlMap[url][method];
      }
    }
  };

  const getMock = (path: string) => {
    return get(store, path, null);
  };

  // get initial store
  setStore();

  // From xhook to content Script
  window.addEventListener("message", (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) return;

    const data: IEventMessage = event.data;

    if (data.to !== "CONTENT_SCRIPT") return;

    if (data.type === "LOG") {
      const message = data.message;
      const mockPath = getMockPath(message.request.url, message.request.method);
      const mock = getMock(mockPath) as IMockResponse;

      if (mock) {
        message.isMocked = mock.active;
        message.mockPath = mockPath;
      }

      chrome.runtime.sendMessage({
        message,
        type: "LOG",
        from: "CONTENT",
        to: "PANEL",
      });
      return;
    }

    const response: Omit<IEventMessage, "type"> = {
      id: data.id,
      from: "CONTENT_SCRIPT",
      to: "HOOK_SCRIPT",
      extenstionName: EXTENSION_NAME,
      message: {},
    };

    const request = data.message.request;
    const mockPath = getMockPath(request.url, request.method);
    const mock = getMock(mockPath) as IMockResponse;

    if (mock && mock.active) {
      response.message.mockResponse = mock;
    }

    window.postMessage(response, "*");
  });

  chrome.runtime.onMessage.addListener((message, sender, response) => {
    //!this.checkIfSameTab(sender.tab)) return;
    if (message.to !== "CONTENT") return;

    if (message.type === "UPDATE_STORE") {
      setStore();
    }
  });
};

const host = location.host;
const isLocalhost = location.href.includes("http://localhost");

chrome.storage.local.get([`bambooMock.extension.active.${host}`], (result) => {
  let active = result[`bambooMock.extension.active.${host}`];
  if (isLocalhost && active === undefined) {
    active = true;
  }
  if (active) {
    // injects script to page's DOM
    inject();
    init();
  }
  // tell the panel about the new injection (host might have changed)
  chrome.runtime.sendMessage({
    host,
    type: "INIT",
    from: "CONTENT",
    to: "PANEL",
  });
});
