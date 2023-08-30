import { RootState } from "app/store";

export const selectHeadlines = (state: RootState) => state.headlines

export const selectContacts = (state: RootState) => state.headlines.contacts