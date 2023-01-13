import { ReduxState, useAppDispatch, useAppSelector } from "@reducers"
import googleUploadApi, { useResumeAllUploadsMutation } from "@reducers/google-upload-api"
import { sessionRenewTime } from "@reducers/misc"
import { useEffect, useRef, useState } from "react"
import { useStore } from "react-redux"
import websocketApi, { IwsAction, processWsMessage, useSendWsMessageMutation } from "websocket/api"
import { ActionTypes as UserDetailsActionTypes } from '@reducers/user-details/ws-message-types';
import googleDownloadApi from "@reducers/google-download-api"
import { QueryActionCreatorResult } from "@reduxjs/toolkit/dist/query/core/buildInitiate"
import useWindowEventListeners from "@hooks/event-listeners/window"

const useConnection = () => {
    const
        [online,setOnline] = useState(true),
        onOnline = ()=> setOnline(true),
        onOffline = ()=> setOnline(false),
        store = useStore(),
        wsService = useRef<QueryActionCreatorResult<any>>(),
        dispatch = useAppDispatch(),
        [sendWsMessage] = useSendWsMessageMutation(),
        websocketWorking = useAppSelector(state => state.misc.websocketWorking),
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        [resumeAllUploads] = useResumeAllUploadsMutation(),
        subscribeWebsocket = async() => {
            if (websocketWorking) return

            const
                state = store.getState() as ReduxState,
                now = Date.now(),
                {lastWebsocketOfflineTime} = state.misc

            if (!!lastWebsocketOfflineTime && lastWebsocketOfflineTime < now - 1000 * 60 * 60) return

            if (!!lastWebsocketOfflineTime){
                try {
                    const 
                        res = await fetch('/pm-api/ws/fetch',{
                            headers: { 
                                'Content-Type': 'application/json',
                                sMethod:'ck',
                            },
                            credentials:'include',
                            method:'POST',
                            body:JSON.stringify({lastWebsocketOfflineTime})
                        }),
                        data = await res.json() as IwsAction[]

                    for (let action of data){
                        await processWsMessage(action,dispatch)
                    }
                    dispatch(sessionRenewTime(now))
                } catch (error) {
                    console.log(error)
                }
            }

            wsService.current = dispatch(websocketApi.endpoints.launchWS.initiate())
        }

    useEffect(()=>{
        if (online) resumeAllUploads()
    },[online])

    useEffect(()=>{
        const uid = (store.getState() as ReduxState).misc.uid
        if (websocketWorking) sendWsMessage({req:UserDetailsActionTypes.onlineUsers,uid})
        else if (!!wsService.current) wsService.current.unsubscribe()
    },[websocketWorking])

    useEffect(()=>{
        setOnline(navigator.onLine)
        dispatch(googleUploadApi.endpoints.initGoogleUpload.initiate())
        dispatch(googleDownloadApi.endpoints.initGoogleDownload.initiate())
    },[])

    useWindowEventListeners([
        {evt:'online',func:onOnline},
        {evt:'offline',func:onOffline},
    ])

    useEffect(()=>{
        if (online && pageVisibility) subscribeWebsocket()
    },[online,pageVisibility])
}

export default useConnection