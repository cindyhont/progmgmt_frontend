import { Room } from "@components/chat/interfaces"
import { chatRoomSelector } from "@components/chat/reducers/slice"
import { ReduxState, useAppSelector } from "@reducers"
import { createSelector } from "@reduxjs/toolkit"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef } from "react"

const useScrollOnReplyEdit = (editorLoaded:boolean) => {
    const
        {query} = useRouter(),
        roomID = query.roomid as string,
        chatWindow = useRef<HTMLElement>(),
        tabBarHeight = useRef(0),
        roomDetailsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (r:Room)=>!!r && (r.reply || r.edit)
        ),[roomID]),
        editOrReply = useAppSelector(state => roomDetailsSelector(state)),
        loaded = useRef(false)

    useEffect(()=>{
        chatWindow.current = document.getElementById('convo-window')
    },[])

    useEffect(()=>{
        if (editorLoaded){
            if (!tabBarHeight.current) tabBarHeight.current = document.getElementById('chat-edit-bar').scrollHeight
            if (loaded.current) chatWindow.current.scrollBy({left:0,top:editOrReply ? tabBarHeight.current : -tabBarHeight.current,behavior:'smooth'})
            else loaded.current = true
        }
    },[editOrReply, editorLoaded])
}

export default useScrollOnReplyEdit