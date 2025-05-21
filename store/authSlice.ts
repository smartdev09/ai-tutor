import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
    userId: string
    name: string
    tokens: number
}

const initialState: UserState = {
    userId: "",
    name: "",
    tokens: 0
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId(state, action: PayloadAction<string>) {
            state.userId = action.payload
        },
        setUserTokens(state, action: PayloadAction<number>) {
            state.tokens = action.payload
        },
        setName(state, action: PayloadAction<string>) {
            state.name = action.payload
        },
    },
})

export const {
    setUserId,
    setName,
    setUserTokens
} = userSlice.actions

export default userSlice.reducer
