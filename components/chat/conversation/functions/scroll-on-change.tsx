import { Room } from "@components/chat/interfaces"
import { chatConvoSelector, chatRoomSelector, updateChatManyRoomStatus, updateChatRoomStatus } from "@components/chat/reducers/slice"
import { ReduxState, useAppSelector } from "@reducers"
import { createSelector } from "@reduxjs/toolkit"
import useFuncWithTimeout from "hooks/counter/function-with-timeout"
import { useRouter } from "next/router"
import { useEffect, useMemo, useRef } from "react"
import { useDispatch, useStore } from "react-redux"
import createConvoIdSelector from "./createConvoIdSelector"

const useScrollOnChange = (editorLoaded:boolean) => {
    const
        {query} = useRouter(),
        roomID = query.roomid as string,
        chatContainerTop = useRef(0),
        store = useStore(),
        dispatch = useDispatch(),
        chatWindowMeasurement = useRef({w:0,h:0,t:0,b:0}),
        editor = useRef<HTMLElement>(),
        editorH = useRef(0),
        chatWindow = useRef<HTMLElement>(),
        chatContainer = useRef<HTMLElement>(),
        toBottomBtn = useRef<HTMLElement>(),
        replyEditBarHeight = useRef(0),
        replyOrEditSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (r:Room)=>!!r && (r.reply || r.edit)
        ),[roomID]),
        replyOrEdit = useAppSelector(state => replyOrEditSelector(state)),
        fetchingConvos = useAppSelector(state => chatRoomSelector.selectById(state,roomID)?.fetchingConvos),
        convoIDselector = useMemo(()=>createConvoIdSelector(roomID),[roomID]),
        convoCount = useAppSelector(state => convoIDselector(state).length),
        onResize = () => {
            const {width,height,top,bottom} = chatWindow.current.getBoundingClientRect()
            if (chatWindowMeasurement.current.w !== width || chatWindowMeasurement.current.h !== height){
                chatContainerTop.current = 0

                const 
                    state = store.getState() as ReduxState,
                    allRoomIDs = chatRoomSelector.selectIds(state)
                dispatch(updateChatManyRoomStatus(allRoomIDs.map(id=>({id,changes:{scrollY:0}}))))
            }
            chatWindowMeasurement.current = {w:width,h:height,t:top,b:bottom}
        },
        onScroll = () => {
            const
                chatContainerRect = chatContainer.current.getBoundingClientRect(),
                atBottom = chatContainerRect.bottom - chatWindowMeasurement.current.b < 200,
                newHeight = window.visualViewport.height - chatWindowMeasurement.current.b + (replyOrEdit ? replyEditBarHeight.current : 0) + 50

            toBottomBtn.current.style.bottom = `${newHeight}px`
            toBottomBtn.current.style.transform = atBottom ? `translateY(${newHeight}px)` : 'none'
            toBottomBtn.current.style.opacity = atBottom ? '0' : '1'

            if (Math.abs(chatContainerRect.bottom - chatWindowMeasurement.current.b) < 1) chatContainerTop.current = 0
            else chatContainerTop.current = chatContainerRect.top
        },
        inputChange = () => {
            const currentH = editor.current.getBoundingClientRect().height
            if (!chatContainerTop.current) chatContainer.current.scrollIntoView({block:'end',behavior:'auto'})
            else if (editorH.current !== currentH) chatWindow.current.scrollBy({top:currentH - editorH.current,behavior:'auto'})

            editorH.current = currentH
        },
        [onInputChange] = useFuncWithTimeout(inputChange,10)
        
    useEffect(()=>{
        chatWindow.current = document.getElementById('convo-window')
        chatContainer.current = document.getElementById('chat-content')
        toBottomBtn.current = document.getElementById('chat-to-bottom-btn')
    },[])

    useEffect(()=>{
        if (editorLoaded){
            if (!editor.current) {
                editor.current = document.getElementById('chat-input')
                editorH.current = editor.current.getBoundingClientRect().height
            }
            editor.current.addEventListener('inputchange',onInputChange,{passive:true})
        }
        return () => {
            if (!!editor.current) editor.current.removeEventListener('inputchange',onInputChange)
        }
    },[editorLoaded])

    useEffect(()=>{
        if (editorLoaded && !!roomID) chatWindow.current.addEventListener('scroll',onScroll,{passive:true})
        return () => {
            chatWindow.current.addEventListener('scroll',onScroll,{passive:true})
            if (!!roomID) dispatch(updateChatRoomStatus({id:roomID,changes:{scrollY:chatContainerTop.current}}))
        }
    },[editorLoaded,roomID,replyOrEdit])

    useEffect(()=>{
        if (editorLoaded){
            onResize()
            window.addEventListener('resize',onResize,{passive:true})
        }
        return () => window.removeEventListener('resize',onResize)
    },[editorLoaded])

    useEffect(()=>{
        // lock scrolling right before old convos are added
        if (editorLoaded && !fetchingConvos) chatWindow.current.style.overflowY = 'hidden'
    },[fetchingConvos])

    useEffect(()=>{
        if (replyOrEdit){
            if (!replyEditBarHeight.current) replyEditBarHeight.current = document.getElementById('chat-reply-bar').scrollHeight
            chatWindow.current.scrollBy({top:replyEditBarHeight.current,behavior:'smooth'})
        } else if (!!replyEditBarHeight.current) {
            chatWindow.current.scrollBy({top:-replyEditBarHeight.current,behavior:'smooth'})
        }
    },[replyOrEdit])

    useEffect(()=>{
        // right after old convos are added, scroll back to the previous position, release scroll lock
        if (editorLoaded && !!convoCount && !!roomID && chatWindow.current.style.overflowY === 'hidden') {
            chatWindow.current.style.overflowY = null
            if (!chatContainerTop.current) chatWindow.current.scrollIntoView({block:'end',behavior:'auto'})
            else {
                const currentRectTop = chatContainer.current.getBoundingClientRect().top
                chatWindow.current.scrollBy({top:currentRectTop - chatContainerTop.current,behavior:'auto'})
            }
        }
    },[convoCount])
}

export default useScrollOnChange