import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

interface UserState {
    userId: string
    name: string
}

const initialState: UserState = {
    userId: "",
    name: "",
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUserId(state, action: PayloadAction<string>) {
            state.userId = action.payload
        },
        setName(state, action: PayloadAction<string>) {
            state.name = action.payload
        },
    },
})

export const {
    setUserId,
    setName,
} = userSlice.actions

export default userSlice.reducer
