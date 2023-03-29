export const safeLocalStorage: Pick<Storage, "setItem"> &
  Pick<Storage, "getItem"> = {
  getItem: (...args) => {
    try {
      return localStorage.getItem(...args);
    } catch (e) {
      return null;
    }
  },
  setItem: (...args) => {
    try {
      return localStorage.setItem(...args);
    } catch (e) {
      return null;
    }
  },
};

export const safeSessionStorage: Pick<Storage, "setItem"> &
  Pick<Storage, "getItem"> = {
  getItem: (...args) => {
    try {
      return sessionStorage.getItem(...args);
    } catch (e) {
      return null;
    }
  },
  setItem: (...args) => {
    try {
      return sessionStorage.setItem(...args);
    } catch (e) {
      return null;
    }
  },
};
