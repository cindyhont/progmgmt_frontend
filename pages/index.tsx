import React, { createContext, Dispatch, memo, useEffect, useReducer } from 'react'
import Head from 'next/head';
import { GetServerSideProps } from 'next'
import { loadMiscReduxState, ssrToLogin } from '../components/functions';
import Layout from '@components/layout';
import ChatPanel from '@components/chat';
import { sliceName as chatSliceName, initialState as chatInitialState } from '@components/chat/reducers/slice'
import { sliceName as tasksSliceName, initialState as tasksInitialState } from '@components/tasks/reducers/slice'
import { sliceName as googleFileSliceName, initialState as googleFileInitialState } from '@reducers/google-download-api/slice'
import { EntityId, EntityState } from '@reduxjs/toolkit';
import { GoogleFile } from '@reducers/google-download-api/slice';
import { Room } from '@components/chat/interfaces';
import { sliceName as userDetailsSliceName } from '@reducers/user-details/slice';
import { useRouter } from 'next/router';
import HRMpanels from '@components/hrm';
import Tasks from '@components/tasks';
import { UserDetails } from '@reducers/user-details/interfaces';
import { Task, TaskApproval, TaskComment, TaskCustomFieldType, TaskField, TaskRecord, TaskTimeRecord } from '@components/tasks/interfaces';
import { initialState as ctxMenuInitialState, reducer as ctxMenuReducer } from '@components/tasks/reducers/dialog-ctxmenu-status'
import { Iaction as IlayoutOrderAction, initialState as layoutOrderInitialState, reducer as layoutOrderReducer } from '@components/tasks/reducers/layout-order'
import { DialogCtxMenuDispatchContext, DialogCtxMenuStateContext } from '@components/tasks/contexts';
import SettingsPage from '@components/settings';
import Dashboard from '@components/dashboard';
import About from '@components/about';
import useInitIDB from 'hooks/indexeddb/init-indexeddb';
import useBroadcastChannelMessenger from 'hooks/broadcast-channel/messenger';
import useAutoRenewSession from 'hooks/session/auto-renew';
import useConnection from 'hooks/session/connection';

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
            dispatchBcMessage = useBroadcastChannelMessenger(),
            [dialogCtxMenuState,dialogCtxMenuStatusDispatch] = useReducer(ctxMenuReducer,ctxMenuInitialState),
            [layoutOrderState,layoutOrderDispatch] = useReducer(layoutOrderReducer,layoutOrderInitialState),
            show = useInitIDB(router.query.page !== 'tasks')

        useConnection()
        useAutoRenewSession()

        useEffect(()=>{
            if (show) dispatchBcMessage(layoutOrderState.list)
        },[layoutOrderState.list])

        return (
            <>
            <Head>
                <title>Project Management Tool</title>
                <meta name="description" content="Project Management Tool"></meta>
                {/*<meta name='viewport' content='width=device-width, interactive-widget=resizes-content' />*/}
            </Head>
            <DialogCtxMenuDispatchContext.Provider value={{dialogCtxMenuStatusDispatch}}>
                <DialogCtxMenuStateContext.Provider value={dialogCtxMenuState}>
                    <LayoutOrderDispatchContext.Provider value={{layoutOrderDispatch}}>
                        {show && <Layout>
                            <IndexPageComponents page={router.query.page as string} />
                        </Layout>}
                    </LayoutOrderDispatchContext.Provider>
                </DialogCtxMenuStateContext.Provider>
            </DialogCtxMenuDispatchContext.Provider>
            </>
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