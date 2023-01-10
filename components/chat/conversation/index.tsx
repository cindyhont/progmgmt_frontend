import React, { useEffect, useReducer, useState } from "react";
import Grid from '@mui/material/Grid';
import ChatInput from "./input";
import { ScrollToBottomBtn, ScrollToBottomBtnContainer } from "./scrollToBottomBtn";
import ChatContent from "./content";
import { ReduxState } from "@reducers";
import { useStore } from "react-redux";
import Header from "./header";
import ReplyBar from "./reply-bar";
import EditBar from "./edit-bar";
import { chatRoomSelector, chatRoomUserSelector } from "../reducers/slice";
import { useRouter } from "next/router";
import { useFetchRepliedConvosAtInitMutation } from "../reducers/api";
import useNarrowBody from "hooks/theme/narrow-body";
import { ChatEventDispatchContext, ChatEventStateContext, initialState, reducer } from "./functions/reducer-context";
import useReturnToPrevRoomUser from "./functions/on-return-to-prev-room-or-user";
import useScrollOnReplyEdit from "./functions/scroll-on-reply-or-edit";
import useViewportLatestConvo from "./functions/viewport-latest-convo";
import useFetchOldConvos from "./functions/fetch-old-convos";
import useScrollOnChange from "./functions/scroll-on-change";
import Spinner from "@components/common-components/spinner";

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
                }
            },
            narrowBody = useNarrowBody(),
            [chatContentEventState,chatContentEventDispatch] = useReducer(reducer,initialState),
            [fetchRepliedConvosAtInit] = useFetchRepliedConvosAtInitMutation()

        useEffect(()=>{
            matchUserID()
        },[userID,roomID])

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
                    <>
                    {show && <Spinner {...{
                        height:'100%',
                        show:show && !chatContentEventState.editorLoaded
                    }} />}
                    <Grid 
                        container 
                        direction='column' 
                        wrap="nowrap" 
                        sx={{
                            position:'relative',
                            height:'100%',
                            overflow:'hidden',
                            display:show && chatContentEventState.editorLoaded ? 'display' : 'none'
                        }}
                    >
                        <Header />
                        <Grid 
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
                            <ChatContent />
                            <ScrollToBottomBtnContainer>
                                <ScrollToBottomBtn />
                            </ScrollToBottomBtnContainer>
                        </Grid>
                        <ReplyBar  />
                        <EditBar />
                        <ChatInput />
                    </Grid>
                    </>
                </ChatEventStateContext.Provider>
            </ChatEventDispatchContext.Provider>
        )
    }

export default Conversation;