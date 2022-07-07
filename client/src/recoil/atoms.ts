import { atom } from "recoil";

export const uploadDialogState = atom({
  key: "uploadDialogState", // unique ID (with respect to other atoms/selectors)
  default: false, // default value (aka initial value)
});

export const moduleListState = atom({
  key: "moduleListState",
  default: [],
});
