import { chatConvoSelector, chatRoomSelector } from "@components/chat/reducers/slice"
import { ReduxState } from "@reducers"
import { createSelector } from "@reduxjs/toolkit"

const createConvoIdSelector = (roomID:string) => createSelector(
    (state:ReduxState)=>state,
    (state:ReduxState)=>{
        if (!roomID) return []
        const room = chatRoomSelector.selectById(state,roomID)
        return !!room ? chatConvoSelector.selectIds(room) : []
    }
)

export default createConvoIdSelector