import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface langState {
  lang: string
}

const initialState: langState = {
    lang: "en",
}

const langSlice = createSlice({
  name: "lang",
  initialState,
  reducers: {
    setLang(state, action: PayloadAction<string>) {
      state.lang = action.payload
    },
  },
})

export const {
    setLang,
} = langSlice.actions

export default langSlice.reducer
