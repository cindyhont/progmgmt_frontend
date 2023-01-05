import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
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
import { useRouter } from "next/router";
import { enterIsPressed } from "@components/functions";
import { useFetchMoreConvosMutation, useFetchRepliedConvosAtInitMutation, useFetchRepliedConvosMutation } from "../reducers/api";
import useNarrowBody from "hooks/theme/narrow-body";
import { ChatEventDispatchContext, ChatEventStateContext, initialState, reducer } from "./functions/reducer-context";
import useReturnToPrevRoomUser from "./functions/on-return-to-prev-room-or-user";
import useScrollOnReplyEdit from "./functions/scroll-on-reply-or-edit";
import useViewportLatestConvo from "./functions/viewport-latest-convo";
import useFetchOldConvos from "./functions/fetch-old-convos";
import useScrollOnChange from "./functions/scroll-on-change";

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
            inputContainer = useRef<HTMLDivElement>(),
            chatWindow = useRef<HTMLDivElement>(),
            chatConvoContainer = useRef<HTMLDivElement>(),
            bottomBtnContainerRef = useRef<HTMLDivElement>(),
            bottomBtnRef = useRef<HTMLButtonElement>(),
            narrowBody = useNarrowBody(),
            [chatContentEventState,chatContentEventDispatch] = useReducer(reducer,initialState),
            [fetchRepliedConvosAtInit] = useFetchRepliedConvosAtInitMutation()

        useEffect(()=>{
            if (!!roomID) fetchRepliedConvosAtInit(roomID)
        },[roomID])
        
        useReturnToPrevRoomUser(chatContentEventState.editorLoaded)
        useScrollOnReplyEdit(chatContentEventState.editorLoaded)
        useViewportLatestConvo(chatContentEventState.editorLoaded)
        useFetchOldConvos(chatContentEventState.editorLoaded)
        useScrollOnChange(chatContentEventState.editorLoaded)

        return (
            <ChatEventDispatchContext.Provider value={chatContentEventDispatch}>
                <ChatEventStateContext.Provider value={chatContentEventState}>
                    <Grid 
                        container 
                        direction='column' 
                        wrap="nowrap" 
                        sx={{
                            position:'relative',
                            height:'100%',
                            overflow:'hidden',
                            display:chatContentEventState.editorLoaded ? 'display' : 'none'
                        }}
                    >
                        <Header />
                        <Grid 
                            ref={chatWindow} 
                            container 
                            direction='column-reverse' 
                            flexWrap='nowrap'
                            id='convo-window'
                            sx={{
                                overflowY:'auto',
                                mb:1,
                                transition:'height 0.2s',
                                ...(narrowBody && {px:1}),
                                height:'100%',
                            }}
                        >
                            <ChatContent ref={chatConvoContainer} />
                            <ScrollToBottomBtnContainer ref={bottomBtnContainerRef}>
                                <ScrollToBottomBtn ref={bottomBtnRef} />
                            </ScrollToBottomBtnContainer>
                        </Grid>
                        <ReplyBar  />
                        <EditBar />
                        <ChatInput ref={inputContainer} />
                    </Grid>
                </ChatEventStateContext.Provider>
            </ChatEventDispatchContext.Provider>
        )
    }

export default Conversation;