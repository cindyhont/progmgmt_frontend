import { chatRoomSelector, chatUserSelector } from "@components/chat/reducers/slice"
import { ReduxState } from "@reducers"
import { useRouter } from "next/router"
import { useEffect, useRef } from "react"
import { useStore } from "react-redux"

const useReturnToPrevRoomUser = (editorLoaded:boolean) => {
    const 
        editor = useRef<HTMLElement>(),
        store = useStore(),
        {query} = useRouter(),
        roomID = query.roomid as string,
        userID = query.userid as string,
        editBar = useRef<HTMLElement>(),
        replyBar = useRef<HTMLElement>(),
        chatWindow = useRef<HTMLElement>(),
        chatContainer = useRef<HTMLElement>(),
        updateTransitions = (transition:string) => {
            replyBar.current.style.transition = transition
            editBar.current.style.transition = transition
            chatWindow.current.style.transition = transition
        }

    useEffect(()=>{
        editBar.current = document.getElementById('chat-edit-bar')
        replyBar.current = document.getElementById('chat-reply-bar')
        chatWindow.current = document.getElementById('convo-window')
        chatContainer.current = document.getElementById('chat-content')
    },[])

    useEffect(()=>{
        if (editorLoaded){
            if (!editor.current) editor.current = document.getElementById('chat-input')
            updateTransitions('none')
            // chatWindow.current.style.opacity = '0'
            const state = store.getState() as ReduxState
    
            if (!!roomID){
                const r = chatRoomSelector.selectById(state,roomID)
                if (!!r && !!r.draft) editor.current.innerHTML = r.draft
                else editor.current.innerHTML = ''

                if (!!r?.scrollY) {
                    const chatContainerTop = chatContainer.current.getBoundingClientRect().top
                    setTimeout(()=>chatWindow.current.scrollBy({top:chatContainerTop - r.scrollY,behavior:'auto'}),10)
                } else if (!!r?.viewportLatestConvoID) {
                    const convoDiv = document.getElementById(`${r.viewportLatestConvoID}`)
                    if (!!convoDiv){
                        const
                            convoDivBottom = convoDiv.getBoundingClientRect().bottom,
                            chatWindowBottom = chatWindow.current.getBoundingClientRect().bottom

                        setTimeout(()=>chatWindow.current.scrollBy({top:convoDivBottom - chatWindowBottom,behavior:'auto'}),10)
                    }
                } else chatContainer.current.scrollIntoView({behavior:'auto',block:'end'})
            } else if (!!userID){
                const u = chatUserSelector.selectById(state,userID)
                if (!!u && !!u.draft) editor.current.innerHTML = u.draft
                else editor.current.innerHTML = ''
            }

            // chatWindow.current.style.opacity = '1'
            updateTransitions('all 0.2s')
        }
    },[roomID,userID,editorLoaded])
}

export default useReturnToPrevRoomUser