import { IStore, DBNameType, IURLMap } from "../interface/mock";
import { IMethod } from "../interface/network";
import { DB_NAME } from "../constants";

export const getDefaultStore = (): IStore => ({
  active: false,
  mocks: [],
  id: 1,
  collections: {},
});

// export const getStore = async (name: string) => {
//   try {
//     return await chrome.storage.local.get([name], result => {
//       return result[name];
//     });
//   } catch (error) {
//     console.log('Can not get local store', error);
//     return false;
//   }
// };

export const updateStore = async (store: IStore) => {
  try {
    await chrome.storage.local.set({ [DB_NAME]: store });
    return true;
  } catch (error) {
    console.log('Can not update local store', error);
    return false;
  }
};

export const removeStore = async (name: string) => {
  try {
    await chrome.storage.local.remove(name);
    return true;
  } catch (error) {
    console.log('Can not update remove store', error);
    return false;
  }
};

export const getNetworkMethodList = (): IMethod[] => [
  "GET",
  "POST",
  "PATCH",
  "PUT",
  "DELETE",
];

export const getNetworkMethodMap = () => ({
  GET: null,
  POST: null,
  PATCH: null,
  PUT: null,
  DELETE: null,
});

export const getURLMap = (store: IStore) => {
  const urlMap: IURLMap = {};
  store.mocks.forEach((mock, index) => {
    if (!urlMap[mock.url]) {
      urlMap[mock.url] = getNetworkMethodMap();
    }

    if (urlMap[mock.url]) {
      urlMap[mock.url][mock.method] = `mocks[${index}]`;
    }
  });

  Object.keys(store.collections).forEach((collection) => {
    const mocks = store.collections[collection].mocks;
    mocks.forEach((mock, index) => {
      if (!urlMap[mock.url]) {
        urlMap[mock.url] = getNetworkMethodMap();
      }

      if (urlMap[mock.url]) {
        urlMap[mock.url][mock.method] = `${collection}.mocks[${index}]`;
      }
    });
  });

  return urlMap;
};
