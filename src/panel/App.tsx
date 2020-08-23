import * as React from "react";
import styled, { ThemeProvider } from "styled-components";
import { debounce, get } from "lodash";
import exportFromJSON from 'export-from-json'
import { confirmAlert } from 'react-confirm-alert';

import Logs from "./logs";
import Mock from "./mocks";
import Create from "./mocks/create";
import Header from "./header";
import {
  ILog,
  IStore,
  IMockResponse,
  IMockResponseRaw,
} from "../interface/mock";
import theme from "./theme";
import { getDefaultStore, updateStore, removeStore } from "../services/collection";
import { Button, Icon } from "./components/table";
import Notification from "./components/notification";
import { DB_NAME } from "../constants";

import "./app.scss";
import 'react-confirm-alert/src/react-confirm-alert.css';

const Wrapper = styled.div<{ alignCenter?: boolean }>`
  background-color: ${({ theme }) => theme.colors.white};
  height: 100%;
  display: flex;
  flex-direction: column;
  ${({ alignCenter }) =>
    alignCenter && `justify-content: center; align-items:center;`};

  p,
  table,
  tr,
  td,
  th,
  div,
  span,
  h1,
  h2,
  h3,
  h4 {
    color: ${({ theme }) => theme.colors.black};
  }
`;

const Content = styled.div`
  overflow: hidden;
  flex-grow: 2;
  display: flex;
`;

const ListWrapper = styled.div`
  flex-grow: 2;
  height: 100%;
`;
const CreateWrapper = styled.div`
  width: 50%;
  min-width: 656px;
`;

const Text = styled.p<{ large?: boolean }>`
  ${({ large }) => large && `font-size: 16px;`}
`;

interface IState {
  logs: ILog[];
  route: "logs" | "logs.create" | "mock.create" | "mock";
  store: IStore;
  rawMock?: IMockResponseRaw;
  filter: {
    search: string;
  };
  storeLoading: boolean;
  notification: { text?: string; show: boolean };
  host: string;
  active: boolean;
  recording: {
    active: boolean;
    index?: number;
  };
}

interface IProps {
  host: string;
  tab: chrome.tabs.Tab;
  active: boolean;
  storeKey: string;
}

type ActionType = "add" | "delete" | "edit" | "clear";

const defaultState: IState = {
  logs: [],
  route: "mock",
  store: getDefaultStore(),
  filter: { search: "" },
  storeLoading: true,
  notification: {
    show: false,
  },
  recording: { active: false },
  host: 'localhost',
  active: true,
}

class App extends React.Component<IProps, IState> {
  notificationTimer: number;
  state: IState = {
    ...defaultState,
    host: this.props.host,
    active: this.props.active,
  };

  componentDidMount() {

    chrome.runtime.onMessage.addListener((message, sender, response) => {
      
      if (message.to !== "PANEL" || !this.checkIfSameTab(sender.tab)) return;
      if (message.type === "LOG") {
        this.setState((prevState) => {
          const newLog: ILog = message.message;
          let logs = prevState.logs;
          if (!newLog.response) {
            logs = [...logs, newLog];
          } else if (newLog.id) {
            logs = logs.map((item) => (item.id === newLog.id ? newLog : item));
          }
          return {
            logs,
          };
        });
      } else if (message.type === "INIT") {
        if (message.host !== this.state.host) {
          const storeKey = `bambooMock.extension.active.${message.host}`;
          const isLocalhost = message.host.includes("http://localhost");
          chrome.storage.local.get([storeKey], (result) => {
            let active = result[storeKey];
            if (isLocalhost && active === undefined) {
              active = true;
            }
            this.setState({ host: message.host, active });
          });
        }
      }
    });

    let store: IStore;
    chrome.storage.local.get([DB_NAME], (result) => {
      store = result[DB_NAME] || getDefaultStore();
      this.setState({ store, storeLoading: false });
    });
  }

  showNotification = (text: string) => {
    if (this.notificationTimer) {
      clearTimeout(this.notificationTimer);
    }
    this.setState({ notification: { text, show: true } });
    this.notificationTimer = setTimeout(() => {
      this.setState((prevState) => ({
        notification: { text: prevState.notification.text, show: false },
      }));
    }, 3000);
  };

  checkIfSameTab = (sender: IProps["tab"]) => {
    const { tab } = this.props;
    return sender.index === tab.index && sender.windowId === tab.windowId;
  };

  changeRoute = (route: IState["route"]) => {
    this.setState({ route });
  };

  updateStateStore = (
    action: ActionType,
    oldStore: IState["store"],
    newMock: IMockResponse,
    bulk?: boolean
  ) => {
    let store = { ...oldStore };

    switch (action) {
      case "add": {

        const sameMock = store.mocks.find(
          (mock) => mock.url === newMock.url && mock.method === newMock.method
        );
        
        if (!!sameMock) {
          if (!bulk) {
            this.showNotification("Mock already exist");
            return;
          }
          return store;
        }
        const id = store.id;

        store.mocks = [...store.mocks, { ...newMock, id }];
        store.id++;
        break;
      }

      case "edit": {
        store.mocks = store.mocks.map((item) =>
          item.id === newMock.id
            ? {
                ...item,
                ...newMock,
              }
            : item
        );
        break;
      }

      case "delete": {
        store.mocks = store.mocks.filter((item) => item.id !== newMock.id);
        break;
      }
    }

    return store;
  };

  handleAction = async (
    action: ActionType,
    newMock: IMockResponse | void,
    tooltip?: string
  ) => {
    if (action === "clear") {
      this.setState({ rawMock: undefined });
      this.changeRoute(
        this.state.route.replace(".create", "") as IState["route"]
      );
      return;
    }

    if (!newMock) {
      return;
    }

    const store = this.updateStateStore(action, this.state.store, newMock);
    if (!store) {
      return;
    }

    const notificationMessage = {
      add: "Mock added Successfully.",
      edit: "Mock edited Successfully.",
      delete: "Mock deleted Successfully.",
    };

    const resUpdateStore = await updateStore(store);
    if(!resUpdateStore) {
      this.showNotification(
        "Something went wrong, please reopen the panel then try."
      );
      return;
    };

    this.setState((prevState: IState) => {
      let logs = prevState.logs;
      if (action === "add") {
        const mockIndex = store.mocks.findIndex((mock) => mock);
        logs = logs.map((log) => {
          if (
            log.request?.url === newMock.url &&
            log.request?.method === newMock.method
          ) {
            return { ...log, mockPath: `mocks[${mockIndex}]` };
          }
          return log;
        });
      }

      if (action === "delete") {
        logs = logs.map((log) => {
          if (
            log.request?.url === newMock.url &&
            log.request?.method === newMock.method
          ) {
            return { ...log, mockPath: undefined };
          }
          return log;
        });
      }

      return { store, logs };
    });

    // Alert the content script
    // so it can refresh store
    this.showNotification(tooltip || notificationMessage[action]);
    chrome.tabs.sendMessage(this.props.tab.id, {
      type: "UPDATE_STORE",
      from: "PANEL",
      to: "CONTENT",
    });
  };

  editMock = (rawMock: IMockResponseRaw) => {
    this.setState({ rawMock }, () => {
      this.changeRoute("mock.create");
    });
  };

  mockNetworkCall = (log: ILog) => {
    this.handleAction("add", this.createMockFromLog(log));
  };

  createMockFromLog = (log: ILog): IMockResponse => ({
    active: true,
    method: log.request?.method || "GET",
    createdOn: new Date().getTime(),
    url: log.request?.url || "/some-url",
    status: log.response?.status || 200,
    response: log.response?.response || "",
    delay: 500,
    id: -1,
  });

  bulkMockLogs = async (logs: ILog[]) => {
    let store = this.state.store;
    logs.forEach((log) => {
      if (log.id && log.mockPath) {
        const tempMock: IMockResponse = get(store.mocks, log.mockPath);
        tempMock.response = log.response.response;
        store = this.updateStateStore("edit", store, tempMock, true);
      } else {
        store = this.updateStateStore(
          "add",
          store,
          this.createMockFromLog(log),
          true
        );
      }
    });

    const resUpdateStore = await updateStore(store);
    if(!resUpdateStore){
      this.showNotification(
        "Recording failed, please refresh Panel & try again!"
      );
      return;
    }

    this.setState((prevState: IState) => {
      let logs = [...prevState.logs];

      logs.forEach((log) => {
        const tempMockIndex = store.mocks.find(
          (mock) =>
            log.request?.url === mock.url &&
            log.request?.method === mock.method
        );
        log.mockPath = `mocks[${tempMockIndex}]`;
      });

      this.showNotification("Mocks updated successfully!");
      chrome.tabs.sendMessage(this.props.tab.id, {
        type: "UPDATE_STORE",
        from: "PANEL",
        to: "CONTENT",
      });

      return {
        logs,
        store,
      };
    });
  };

  onRecordingClick = () => {
    this.setState((prevState: IState) => {
      if (!prevState.recording.active) {
        return {
          recording: {
            active: true,
            index: prevState.logs.length,
          },
        };
      }

      this.bulkMockLogs(prevState.logs.slice(prevState.recording.index!));
      return {
        recording: {
          active: false,
        },
      };
    });
  };

  handleSearchChange = debounce((search: string) => {
    this.setState({ filter: { search } });
  }, 500);

  filterStore = (oldStore: IStore, search) => {
    const store = { ...oldStore };
    store.mocks = store.mocks.filter((item) => item.url.includes(search));
    Object.keys(store.collections).forEach((collection) => {
      store[collection].mocks = store[collection].mocks.filter((item) =>
        item.url.includes(search)
      );
    });

    return store;
  };

  editMockFromLog = (path: string) => {
    if (!path) {
      this.showNotification("Can't Edit this mock, try reopening the panel.");
    }

    this.setState({ rawMock: get(this.state.store, path) }, () => {
      this.changeRoute("logs.create");
    });
  };

  clear = () => {
    const { route, logs, store: { mocks } } = this.state;
    const { host, active } = this.props;

    if(route.includes('logs') && logs.length > 0) {
      this.setState({
        logs: [],
      });
      return;
    }

    if(route.includes('mock') && mocks.length > 0) {
      confirmAlert({
        title: 'Do you want to clear all mocks that saved ?',
        message: 'Please make sure about this, if you click yes you will lost all mocks that you have saved.',
        buttons: [
          {
            label: 'Yes',
            onClick: async () => {
              await updateStore(getDefaultStore());
              this.setState({
                ...defaultState,
                host,
                active,
                storeLoading: false,
              });
            }
          },
          {
            label: 'No',
            onClick: () => null,
          }
        ]
      });
      return;
    }

  };

  toggleBambooMock = () => {
    const next = !this.state.active;
    chrome.storage.local.set({ [this.props.storeKey]: next }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.update(tabs[0].id, { url: tabs[0].url });
        location.reload();
      });
    });
  };

  addMock = () => {
    this.changeRoute("mock.create");
    this.setState({ rawMock: undefined });
  };

  onImport = () => {
    let fileChooser = document.createElement("input");
    fileChooser.setAttribute('style', 'display: none');
    fileChooser.type = 'file';

    fileChooser.addEventListener('change', (evt: any) => {
      var f = evt.target.files[0];
      if(f) {
        var reader = new FileReader();
        reader.onload = async (e: any) => {
          var store = JSON.parse(e.target.result);
          if(store && !store.mocks) {
            this.showNotification(
              "We only support JSON file. Please try again."
            );
            return;
          };

          // Remove local store and append new value
          const resRemove = await removeStore(DB_NAME);
          if(resRemove) {
            this.setState({
              storeLoading: true,
            }, async () => {
              const resUpdateStore = await updateStore(store)
              if(!resUpdateStore) {
                this.showNotification(
                  "Something went wrong, please reopen the panel then try."
                );
                return;
              };
              
              this.setState({
                store,
                storeLoading: false,
              });
            });
          }
        }
        reader.readAsText(f);
      }
    });

    document.body.appendChild(fileChooser);
    fileChooser.click();
  };

  onExport = async () => {
    chrome.storage.local.get([DB_NAME], (result) => {
      if(result[DB_NAME]) {
        const data = result[DB_NAME];
        const fileName = 'bambooMock_sample'
        const exportType = 'json'
        
        exportFromJSON({ data, fileName, exportType })
      }
    });

  }

  getContent = () => {
    if (!this.state.host || !this.props.tab) {
      return (
        <Wrapper alignCenter>
          <Text>
            Unable to load the Panel. Please focus on the current tab and retry.
          </Text>
          <Button transparent link onClick={() => location.reload()}>
            Refresh
          </Button>
        </Wrapper>
      );
    }

    if (!this.state.active) {
      return (
        <Wrapper alignCenter>
          <Text>
            Mocking is disabled by default on non-localhost urls. Enabling will
            refresh the current page.
          </Text>
          <Button
            style={{ marginTop: 8 }}
            background="primary"
            color="white"
            icon
            onClick={this.toggleBambooMock}
          >
            <Icon>lock_open</Icon> Enable
          </Button>
        </Wrapper>
      );
    }

    if (this.state.storeLoading) {
      return (
        <Wrapper alignCenter>
          <Icon color="primary" style={{ marginBottom: 16, fontSize: 40 }}>
            system_update_alt
          </Icon>
          <Text large>Getting App Data...</Text>
        </Wrapper>
      );
    }
    const {
      route,
      logs,
      store,
      rawMock,
      filter: { search },
      recording,
    } = this.state;

    const filteredLogs =
      !search || route === "mock"
        ? logs
        : logs.filter((item) => (item.request?.url || "").includes(search));

    const filteredStore =
      !search || route === "logs" ? store : this.filterStore(store, search);

    return (
      <Wrapper>
        <Header
          onImport={this.onImport}
          onExport={this.onExport}
          addMock={this.addMock}
          clear={this.clear}
          onSearchChange={this.handleSearchChange}
          route={route}
          changeRoute={this.changeRoute}
          disableMocking={this.toggleBambooMock}
          recording={recording.active}
          onRecordingClick={this.onRecordingClick}
          logs={this.state.logs}
          mocks={this.state.store.mocks}
        />
        <Content>
          {route.includes("logs") && (
            <ListWrapper>
              <Logs
                active={this.state.active}
                mockNetworkCall={this.mockNetworkCall}
                changeRoute={this.changeRoute}
                logs={filteredLogs}
                editMock={this.editMockFromLog}
              />
            </ListWrapper>
          )}
          {route.includes("mock") && (
            <ListWrapper>
              <Mock
                onAction={this.handleAction}
                changeRoute={this.changeRoute}
                store={filteredStore}
                route={route}
                editMock={this.editMock}
              />
            </ListWrapper>
          )}
          {route.includes("create") && (
            <CreateWrapper>
              <Create
                mock={rawMock}
                onAction={this.handleAction}
                changeRoute={this.changeRoute}
              />
            </CreateWrapper>
          )}
        </Content>
      </Wrapper>
    );
  };

  render() {
    return (
      <ThemeProvider theme={theme}>
        {this.getContent()}
        {this.state.notification && (
          <Notification
            show={this.state.notification.show}
            text={this.state.notification.text}
          ></Notification>
        )}
      </ThemeProvider>
    );
  }
}

export default App;
