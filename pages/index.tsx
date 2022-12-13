import React, { createContext, Dispatch, memo, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { GetServerSideProps } from 'next'
import { loadMiscReduxState, ssrToLogin, updateSession } from '../components/functions';
import Layout from '@components/layout';
import ChatPanel from '@components/chat';
import { sliceName as chatSliceName, initialState as chatInitialState } from '@components/chat/reducers/slice'
import { sliceName as tasksSliceName, initialState as tasksInitialState, taskFieldSelector, taskEditMultipleFields } from '@components/tasks/reducers/slice'
import { sliceName as googleFileSliceName, initialState as googleFileInitialState, googleFileSelector } from '@reducers/google-download-api/slice'
import { createSelector, EntityId, EntityState } from '@reduxjs/toolkit';
import { GoogleFile } from '@reducers/google-download-api/slice';
import { Room } from '@components/chat/interfaces';
import { sliceName as userDetailsSliceName } from '@reducers/user-details/slice';
import { useRouter } from 'next/router';
import HRMpanels from '@components/hrm';
import Tasks from '@components/tasks';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { UserDetails } from '@reducers/user-details/interfaces';
import googleUploadApi, { useResumeAllUploadsMutation } from '@reducers/google-upload-api';
import googleDownloadApi from '@reducers/google-download-api';
import { Task, TaskApproval, TaskComment, TaskCustomFieldType, TaskField, TaskRecord, TaskTimeRecord } from '@components/tasks/interfaces';
import { useStore } from 'react-redux';
import { initialState as ctxMenuInitialState, reducer as ctxMenuReducer } from '@components/tasks/reducers/dialog-ctxmenu-status'
import { Iaction as IlayoutOrderAction, initialState as layoutOrderInitialState, reducer as layoutOrderReducer } from '@components/tasks/reducers/layout-order'
import { DialogCtxMenuDispatchContext, DialogCtxMenuStateContext } from '@components/tasks/contexts';
import IndexedDB from '@indexeddb';
import { indexeddbWorks, sessionRenewTime } from '@reducers/misc';
import { IidbTaskField } from '@indexeddb/interfaces';
import { updateTaskFieldLayoutInRedux } from '@indexeddb/functions';
import websocketApi, { IwsAction, processWsMessage, useSendWsMessageMutation } from 'websocket/api';
import { ActionTypes as UserDetailsActionTypes } from '@reducers/user-details/ws-message-types';
import { googleFilePrelimSelector } from '@reducers/google-upload-api/slice';
import SettingsPage from '@components/settings';
import Dashboard from '@components/dashboard';
import About from '@components/about';

export const getServerSideProps: GetServerSideProps = async ({res,req:{cookies,url},resolvedUrl,query}) => {
    let 
        files:EntityState<GoogleFile> = null,
        rooms:EntityState<Room> = null,
        uid:string = '',
        userDetails:EntityState<UserDetails> = null,
        tasks:EntityState<Task> = null,
        comments:EntityState<TaskComment> = null,
        taskRecords:EntityState<TaskRecord> = null,
        approvalList:EntityState<TaskApproval> = null,
        customFieldTypes:EntityState<TaskCustomFieldType> = null,
        customFields:TaskField[] = [],
        timeRecords:EntityState<TaskTimeRecord> = null,
        chatRoomID = '',
        chatUserID = '',
        username = '',
        maxChildTaskLvl = 1,
        visitor = false

    if (resolvedUrl==='/' && !!query.page && query.page==='chat'){
        if (!!query.roomid && typeof query.roomid==='string') chatRoomID = query.roomid
        if (!!query.userid && typeof query.userid==='string') chatUserID = query.userid
    }

    if (cookies.hasOwnProperty('sid')){
        try {
            const 
                response = await fetch(`${process.env.NEXT_PUBLIC_SSR_API_URL}/init-index`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        sMethod:'body',
                        sid:cookies.sid,
                        ...(!!chatRoomID && {chatroomid:chatRoomID}),
                        ...(!!chatUserID && {chatuserid:chatUserID})
                    },
                }),
                json = await response.json()

            if (!json.session){
                res.setHeader('Set-Cookie', [`sid=${cookies.sid}; expires=${new Date(Date.now() - 100000).toUTCString()}; path=/; httponly; secure; samesite=strict`]);
                return {redirect:{destination:ssrToLogin(url),permanent:false}}
            } else {
                res.setHeader('Set-Cookie', [`sid=${json.session.sid}; expires=${new Date(json.session.expires).toUTCString()}; path=/; httponly; secure; samesite=strict`]);
                const data = json.data as {
                    files:EntityState<GoogleFile>;
                    rooms:EntityState<Room>;
                    systemStarted:boolean;
                    uid:string;
                    users:EntityState<UserDetails>;

                    tasks:EntityState<Task>;
                    comments:EntityState<TaskComment>;
                    taskRecords:EntityState<TaskRecord>;
                    approvalList:EntityState<TaskApproval>;
                    customFieldTypes:EntityState<TaskCustomFieldType>;
                    timeRecords:EntityState<TaskTimeRecord>;
                    customFields:{id:EntityId;fieldType:EntityId;details:any;fieldName:string}[];
                    moveToChatMainPage:boolean;
                    username:string;
                    maxChildTaskLvl:number;
                    visitor:boolean;
                }
                if (!data.systemStarted) return {redirect:{destination:'/start',permanent:false}}
                else if (!!data.moveToChatMainPage) return {redirect:{destination:'/chat',permanent:false}}
                else if (data.visitor && query.page === 'hrm' || !data.visitor && query.page === 'about') return {redirect:{destination:'/',permanent:false}}
                else {
                    const initialSidebarModuleLength = Object.values(tasksInitialState.fields.entities).filter(e=>e.detailsSidebarOrder!==-1).length
                    files = data.files
                    rooms = data.rooms
                    uid = data.uid
                    userDetails = data.users
                    tasks = data.tasks
                    comments = data.comments
                    taskRecords = data.taskRecords
                    approvalList = data.approvalList
                    customFieldTypes = data.customFieldTypes
                    timeRecords = data.timeRecords
                    customFields = data.customFields.map((e,i)=>({
                        ...e,
                        listView:true,
                        listNarrowScreenOrder:-1,
                        listWideScreenOrder:-1,
                        detailsSidebarExpand:true,
                        detailsSidebarOrder:initialSidebarModuleLength+i
                    }))
                    username = data.username
                    maxChildTaskLvl = data.maxChildTaskLvl
                    visitor = data.visitor
                }
            }
        } catch (error) {
            res.setHeader('Set-Cookie', [`sid=${cookies.sid}; expires=${new Date(Date.now() - 100000).toUTCString()}; path=/; httponly; secure; samesite=strict`]);
            return {redirect:{destination:ssrToLogin(url),permanent:false}}
        }
    } else {
        return {redirect:{destination:ssrToLogin(url),permanent:false}}
    }

    return {
        props:{
            preloadedState:{
                misc:{
                    ...loadMiscReduxState(true,uid),
                    currentSessionStartTime:Date.now(),
                    username,
                    maxChildTaskLvl,
                    visitor,
                },
                [chatSliceName]:{
                    ...chatInitialState,
                    rooms,
                    ...(!!chatUserID && {users:{
                        ids:[chatUserID],
                        entities:{
                            [chatUserID]:{
                                id:chatUserID,
                                draft:'',
                                fileInputs:{
                                    ids:[],
                                    entities:{},
                                },
                            }
                        }
                    }})
                },
                [tasksSliceName]:{
                    ...tasksInitialState,
                    tasks,
                    comments,
                    taskRecords,
                    approvalList,
                    customFieldTypes,
                    timeRecords,
                    fields:{
                        ids:[...tasksInitialState.fields.ids,...customFields.map(({id})=>id)],
                        entities:{
                            ...tasksInitialState.fields.entities,
                            ...customFields.map(e=>({[e.id]:e})).reduce((a,b)=>({...a,...b}))
                        }
                    }
                },
                [userDetailsSliceName]:{
                    ...userDetails,
                },
                [googleFileSliceName]:{
                    ...googleFileInitialState,
                    ...files
                }
            },
        }
    }
}

const 
    LayoutOrderDispatchContext = createContext<{layoutOrderDispatch:Dispatch<IlayoutOrderAction>}>({layoutOrderDispatch:()=>{}}),
    IndexPage = () => {
        const 
            router = useRouter(),
            store = useStore(),
            idb = useRef<IndexedDB>(),
            bc = useRef<BroadcastChannel>(),
            wsService = useRef<any>(),
            dispatch = useAppDispatch(),
            [dialogCtxMenuState,dialogCtxMenuStatusDispatch] = useReducer(ctxMenuReducer,ctxMenuInitialState),
            [layoutOrderState,layoutOrderDispatch] = useReducer(layoutOrderReducer,layoutOrderInitialState),
            fiftyNineMinutes = useRef(3540000).current,
            [sendWsMessage] = useSendWsMessageMutation(),
            websocketWorking = useAppSelector(state => state.misc.websocketWorking),
            online = useAppSelector(state => state.misc.online),
            pageVisibility = useAppSelector(state => state.misc.pageVisibility),
            [show,setShow] = useState(router.query.page !== 'tasks'),
            [resumeAllUploads] = useResumeAllUploadsMutation(),
            fileTransmittingSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>googleFileSelector.selectAll(state).filter(e=>!!e.downloading).length !== 0,
                (state:ReduxState)=>googleFilePrelimSelector.selectAll(state).filter(e=>!e.googleFileID).length !== 0,
                (downloading:boolean,uploading:boolean) => downloading || uploading
            ),[]),
            fileTransmitting = useAppSelector(state => fileTransmittingSelector(state)),
            renewSessionInterval = useRef<NodeJS.Timer>(),
            renewSession = () => updateSession(router,dispatch),
            onOnline = () => resumeAllUploads(),
            initIndexedDB = async() => {
                const 
                    state = store.getState() as ReduxState,
                    success = await idb.current.setupDB()
                if (!success) return
                dispatch(indexeddbWorks())

                const 
                    idbTaskFieldList:IidbTaskField[] = await idb.current.getAll(idb.current.storeNames.taskFields),
                    taskFields = taskFieldSelector.selectAll(state)

                if (!idbTaskFieldList.length) {
                    setShow(true)
                    idb.current.addMulitpleEntries(
                        idb.current.storeNames.taskFields,
                        taskFields.filter(e=>e.fieldType!=='order_in_board_column').map(({id,listWideScreenOrder,listNarrowScreenOrder,detailsSidebarOrder,detailsSidebarExpand})=>({
                            id,listWideScreenOrder,listNarrowScreenOrder,detailsSidebarOrder,detailsSidebarExpand
                        }))
                    )
                    return
                }
                const updates = updateTaskFieldLayoutInRedux(taskFields,idbTaskFieldList)
                if (!!updates.length) dispatch(taskEditMultipleFields(updates))
                setShow(true)
            },
            handleBCmessage = (e:MessageEvent) => {
                const 
                    list = e.data as IidbTaskField[],
                    state = store.getState() as ReduxState,
                    allFields = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                    allSameAsStore = list.every(e=>{
                        const idx = allFields.findIndex(f=>f.id===e.id)
                        if (idx === -1) return false
                        const 
                            field = allFields[idx],
                            entries = Object.entries(e),
                            len = entries.length
                        for (let i=0; i<len; i++){
                            const p = entries[i]
                            if (p[1] !== field[p[0]]) return false
                        }
                        return true
                    })
                if (!allSameAsStore) dispatch(taskEditMultipleFields(list.map(e=>({
                    id:e.id,
                    changes:{
                        ...Object.entries(e)
                            .filter(f=>f[0] !== 'id')
                            .map(f=>({[f[0]]:f[1]}))
                            .reduce((a,b)=>({...a,...b}))
                    }
                }))))
            },
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
                            res = await fetch('/api/ws/fetch',{
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
            },
            testCookies = async () => {
                try {
                    const res = await fetch('/api/test-cookies', {
                        method: 'GET',
                        headers: { 
                            'Content-Type': 'application/json',
                            sMethod:'ck',
                            credentials:'include',
                        },
                    })
                    console.log('res: ',res)
                    const json = await res.json()
                    console.log('json: ',json)
                } catch (error) {
                    console.log('error: ',error)
                }
            }

        useEffect(()=>{
            if (fileTransmitting) {
                renewSession()
                renewSessionInterval.current = setInterval(renewSession,fiftyNineMinutes)
            }
            return () => clearInterval(renewSessionInterval.current)
        },[fileTransmitting])
            
        useEffect(()=>{
            testCookies()
            dispatch(googleUploadApi.endpoints.initGoogleUpload.initiate())
            dispatch(googleDownloadApi.endpoints.initGoogleDownload.initiate())

            const state = store.getState() as ReduxState
            idb.current = new IndexedDB(state.misc.uid.toString(),1)
            initIndexedDB()

            bc.current = new BroadcastChannel('taskLayouts')
            bc.current.addEventListener('message',handleBCmessage)
            
            return () => {
                bc.current.removeEventListener('message',handleBCmessage)
                bc.current.close()
            }
        },[])

        useEffect(()=>{
            if (online) onOnline()
        },[online])

        useEffect(()=>{
            if (websocketWorking) sendWsMessage({req:UserDetailsActionTypes.onlineUsers})
            else if (!!wsService.current) wsService.current.unsubscribe()
        },[websocketWorking])

        useEffect(()=>{
            if (show) bc.current.postMessage(layoutOrderState.list)
        },[layoutOrderState.list])

        useEffect(()=>{
            if (online && pageVisibility) subscribeWebsocket()
        },[online,pageVisibility])

        return (
            <DialogCtxMenuDispatchContext.Provider value={{dialogCtxMenuStatusDispatch}}>
                <DialogCtxMenuStateContext.Provider value={dialogCtxMenuState}>
                    <LayoutOrderDispatchContext.Provider value={{layoutOrderDispatch}}>
                        {show && <Layout>
                            <IndexPageComponents page={router.query.page as string} />
                        </Layout>}
                    </LayoutOrderDispatchContext.Provider>
                </DialogCtxMenuStateContext.Provider>
            </DialogCtxMenuDispatchContext.Provider>
        )
    },
    IndexPageComponents = memo(({page}:{page:string}) => (
        <>
        {(!page || page==='dashboard') && <Dashboard />}
        {page==='chat' && <ChatPanel />}
        {page==='hrm' && <HRMpanels />}
        {page==='tasks' && <Tasks />}
        {page==='settings' && <SettingsPage />}
        {page==='about' && <About />}
        </>
    ))

IndexPageComponents.displayName = 'IndexPageComponents'
export default IndexPage;
export { LayoutOrderDispatchContext }