import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Grid from '@mui/material/Grid';
import ChatInput from "./input";
import { ScrollToBottomBtn, ScrollToBottomBtnContainer } from "./scrollToBottomBtn";
import ChatContent from "./content";
import { ReduxState, useAppSelector } from "@reducers";
import { useStore } from "react-redux";
import Header from "./header";
import ReplyBar from "./reply-bar";
import EditBar from "./edit-bar";
import { createSelector } from "@reduxjs/toolkit";
import { Room } from "../interfaces";
import { chatConvoSelector, chatRoomSelector, chatRoomUserSelector, chatUserSelector, updateChatRoomStatus } from "../reducers/slice";
import { useDispatch } from "react-redux";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from "@mui/material";
import { useRouter } from "next/router";
import { enterIsPressed } from "@components/functions";
import { useFetchMoreConvosMutation, useFetchRepliedConvosAtInitMutation, useFetchRepliedConvosMutation } from "../reducers/api";

const 
    Conversation = () => {
        const 
            router = useRouter(),
            store = useStore(),
            roomID = router.query.roomid as string,
            userID = router.query.userid as string,
            [show,setShow] = useState(false),
            matchUserID = () => {
                if (!!roomID) setShow(true)
                else if (!!userID){
                    const 
                        state = store.getState() as ReduxState,
                        uid = state.misc.uid

                    if (userID === uid) {
                        router.push('/?page=chat','/chat',{shallow:true})
                        return
                    }
                    const rooms = chatRoomSelector.selectAll(state)

                    for (let room of rooms) {
                        if (chatRoomUserSelector.selectIds(room).includes(userID)) {
                            router.push(`/?page=chat&roomid=${room.id}`,`/chat/r/${room.id}`,{shallow:true})
                            return
                        }
                    }
                    setShow(true)
                } else setShow(false)
            }

        useEffect(()=>{
            matchUserID()
        },[userID,roomID])

        if (show && (!!roomID || !!userID)) return <ConversationContent />
        else return <Grid sx={{borderLeft:'1px solid rgba(255,255,255,0.1)',height:'100%'}} />
    },
    ConversationContent = () => {
        const
            {query} = useRouter(),
            roomID = query.roomid as string,
            userID = query.userid as string,
            containerRef = useRef<HTMLDivElement>(),
            headerRef = useRef<HTMLDivElement>(),
            bodyRef = useRef<HTMLDivElement>(),
            chatConvoContainer = useRef<HTMLDivElement>(),
            editorRef = useRef<HTMLDivElement>(),
            submitBtnRef = useRef<HTMLButtonElement>(),
            [editorLoaded,setEditorLoaded] = useState(false),
            editorIsLoaded = useCallback(()=>setEditorLoaded(true),[]),
            toBottom = useCallback(()=>chatConvoContainer.current.scrollIntoView({behavior:'smooth',block:'end'}),[]),
            bottomBtnContainerRef = useRef<HTMLDivElement>(),
            bottomBtnRef = useRef<HTMLButtonElement>(),
            replyRef = useRef<HTMLDivElement>(),
            tabBarHeightRef = useRef(0),
            editRef = useRef<HTMLDivElement>(),
            roomDetailsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (r:Room)=>({
                    replyStatus:!!r && r.reply,
                    editStatus:!!r && r.edit,
                    fetchingConvos:!!r && r.fetchingConvos,
                    convoCount:!!r ? chatConvoSelector.selectTotal(r) : 0
                })
            ),[roomID]),
            {replyStatus,editStatus,fetchingConvos,convoCount} = useAppSelector(state => roomDetailsSelector(state)),
            store = useStore(),
            dispatch = useDispatch(),
            [fetchMoreConvos] = useFetchMoreConvosMutation(),
            [fetchRepliedConvos] = useFetchRepliedConvosMutation(),
            onScroll = () => {
                const 
                    convoListRect = chatConvoContainer.current.getBoundingClientRect(),
                    atBottom = convoListRect.bottom - bodyRef.current.getBoundingClientRect().bottom < 200,
                    newHeight = editorRef.current.getBoundingClientRect().height + (replyStatus || editStatus ? tabBarHeightRef.current : 0) + 50
                    
                bottomBtnContainerRef.current.style.bottom = `${newHeight}px`
                bottomBtnContainerRef.current.style.transform = atBottom ? `translateY(${newHeight}px)` : 'none'
                bottomBtnContainerRef.current.style.opacity = atBottom ? '0' : '1'
                bottomBtnRef.current.disabled = atBottom
                bottomBtnRef.current.style.cursor = atBottom ? 'default' : 'pointer'
                
                if (!!roomID) {
                    dispatch(updateChatRoomStatus({id:roomID,changes:{scrollY:bodyRef.current.scrollTop}}))
                    const 
                        state = store.getState() as ReduxState,
                        room = chatRoomSelector.selectById(state,roomID)
                    if (!room || !room.hasMoreConvos || room.fetchingConvos) return

                    if (convoListRect.top > -500) fetchMoreConvos(roomID)
                    else {
                        const
                            allConvoIDs = chatConvoSelector.selectIds(room),
                            convosWithReply = chatConvoSelector.selectAll(room).filter(e=>!!e.replyMsgID),
                            convosNoReplyDownloaded = convosWithReply.filter(e=>!allConvoIDs.includes(e.replyMsgID)),
                            len = convosNoReplyDownloaded.length
                        if (!len) return
                        const 
                            idToCheck = len===1 ? convosNoReplyDownloaded[0].id : convosNoReplyDownloaded.sort((a,b)=>b.dt - a.dt)[0].id,
                            elem = document.getElementById(idToCheck.toString()),
                            rect = elem.getBoundingClientRect()
                        if (rect.bottom > -500) fetchRepliedConvos({roomID,convoID:idToCheck})
                    }
                }
            },
            updateTransitions = (transition:string) => {
                replyRef.current.style.transition = transition
                editRef.current.style.transition = transition
                bodyRef.current.style.transition = transition
            },
            {breakpoints:{up}} = useTheme(),
            matchesSM = useMediaQuery(up('sm')),
            matchesMD = useMediaQuery(up('md')),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            timestamp = useRef(0),
            inputH = useRef(0),
            editorTimeoutRef = useRef<NodeJS.Timeout>(),
            editorOnChange = () => {
                clearTimeout(editorTimeoutRef.current)
                const editorHeight = editorRef.current.getBoundingClientRect().height
                if (inputH.current !== editorHeight) {
                    bodyRef.current.scrollBy(0,editorHeight - inputH.current)
                    inputH.current = editorHeight
                }
            },
            setEditorTimeout = () => editorTimeoutRef.current = setTimeout(editorOnChange,10),
            onInputEvent = (e:KeyboardEvent) => {
                if (e.timeStamp === timestamp.current) return
                timestamp.current = e.timeStamp
                if (enterIsPressed(e)) setTimeout(toBottom,10)
                else setEditorTimeout()
            },
            onClipboardEvent = (e:ClipboardEvent) => {
                if (e.timeStamp === timestamp.current) return
                timestamp.current = e.timeStamp
                setEditorTimeout()
            },
            renewBodyTimeout = useRef<NodeJS.Timeout>(),
            renewBody = (scrollY:number) => bodyRef.current.scrollTo(0,scrollY),
            setRenewBodyTimeout = (scrollY:number) => renewBodyTimeout.current = setTimeout(renewBody,10,scrollY),
            [fetchRepliedConvosAtInit] = useFetchRepliedConvosAtInitMutation()

        useEffect(()=>{
            if (editorLoaded && !fetchingConvos) bodyRef.current.style.overflowY = 'hidden'
        },[fetchingConvos])

        useEffect(()=>{
            if (editorLoaded && !!convoCount && !!roomID && bodyRef.current.style.overflowY === 'hidden') {
                const 
                    state = store.getState() as ReduxState,
                    room = chatRoomSelector.selectById(state,roomID),
                    scrollY = room.scrollY
                renewBody(scrollY)
                bodyRef.current.style.overflowY = 'auto'
            }
        },[convoCount])

        useEffect(()=>{
            if (editorLoaded){
                bodyRef.current.scrollBy({left:0,top:replyStatus || editStatus ? tabBarHeightRef.current : -tabBarHeightRef.current,behavior:'smooth'})
            }
        },[replyStatus || editStatus])
        
        useEffect(()=>{
            if (editorLoaded){
                replyRef.current.style.height = `${replyStatus ? tabBarHeightRef.current : 0}px`
                editRef.current.style.height = `${editStatus ? tabBarHeightRef.current : 0}px`
            } else {
                replyRef.current.style.height = '0px'
                editRef.current.style.height = '0px'
            }
        },[replyStatus,editStatus])

        useEffect(()=>{
            if (!!roomID) fetchRepliedConvosAtInit(roomID)
        },[roomID])
        
        useEffect(()=>{
            if (editorLoaded){
                if (!editorRef.current) {
                    editorRef.current = document.getElementById('chat-input') as HTMLDivElement
                    submitBtnRef.current = document.getElementById('chat-submit-btn') as HTMLButtonElement
                    inputH.current = editorRef.current.getBoundingClientRect().height
                    tabBarHeightRef.current = replyRef.current.scrollHeight
                }
                editorRef.current.addEventListener('keydown',onInputEvent)
                submitBtnRef.current.addEventListener('click',setEditorTimeout)
                editorRef.current.removeEventListener('cut',onClipboardEvent)
                editorRef.current.removeEventListener('paste',onClipboardEvent)
                
                updateTransitions('none')
            
                const state = store.getState() as ReduxState
    
                if (!!roomID){
                    const r = chatRoomSelector.selectById(state,roomID)
                    if (!!r && !!r.draft) editorRef.current.innerHTML = r.draft
                    else editorRef.current.innerHTML = ''

                    setRenewBodyTimeout(!!r ? r.scrollY : 0)
                } else if (!!userID){
                    const u = chatUserSelector.selectById(state,userID)
                    if (!!u && !!u.draft) editorRef.current.innerHTML = u.draft
                    else editorRef.current.innerHTML = ''
                }
    
                updateTransitions('all 0.2s')
            }
            return () => {
                if (!!submitBtnRef.current) submitBtnRef.current.addEventListener('click',setEditorTimeout)

                if (!!editorRef.current) {
                    editorRef.current.addEventListener('keydown',onInputEvent)
                    editorRef.current.removeEventListener('cut',onClipboardEvent)
                    editorRef.current.removeEventListener('paste',onClipboardEvent)
                }
            }
        },[editorLoaded,roomID,userID])

        useEffect(()=>{
            if (editorLoaded && !!bodyRef.current) bodyRef.current.addEventListener('scroll',onScroll)
            return () => {
                if (!!bodyRef.current) bodyRef.current.removeEventListener('scroll',onScroll)
            }
        },[editorLoaded,replyStatus || editStatus,roomID,userID])

        return (
            <Grid 
                ref={containerRef} 
                container 
                direction='column' 
                wrap="nowrap" 
                sx={{
                    position:'relative',
                    height:'100%',
                    overflow:'hidden',
                    display:editorLoaded ? 'display' : 'none'
                }}
            >
                <Header ref={headerRef} />
                <Grid 
                    ref={bodyRef} 
                    container 
                    direction='column-reverse' 
                    flexWrap='nowrap'
                    id='convo-container'
                    sx={{
                        overflowY:'auto',
                        mb:1,
                        transition:'height 0.2s',
                        ...((!matchesSM || !matchesMD && sidebarOpen) && {px:1}),
                        height:'100%',
                    }}
                >
                    <ChatContent ref={chatConvoContainer} />
                    <ScrollToBottomBtnContainer ref={bottomBtnContainerRef}>
                        <ScrollToBottomBtn ref={bottomBtnRef} scrollToBottom={toBottom} />
                    </ScrollToBottomBtnContainer>
                </Grid>
                <ReplyBar ref={replyRef}  />
                <EditBar ref={editRef} />
                <ChatInput {...{editorLoaded,editorIsLoaded}} />
            </Grid>
        )
    }

export default Conversation;