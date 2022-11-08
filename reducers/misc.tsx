import { createSlice, EntityId } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export interface Imisc {
    online:boolean;
    systemDark:boolean;
    userMode:'dark'|'light'|'system';
    sidebarOpen:boolean|null;
    authRequired:boolean;
    signedIn:boolean;
    loading:boolean;
    uid:EntityId;
    fileTransferListOpen:boolean;
    indexeddbOK:boolean;
    isTouchScreen:boolean;
    websocketWorking:boolean;
    lastWebsocketOfflineTime:number;
    currentSessionStartTime:number;
    pageVisibility:boolean;
    username:string;
    maxChildTaskLvl:number;
    googleChartLoaded:boolean;
    routerAsPath:string;
    routerQuery:string;
    visitor:boolean;
}

const
    sliceName = 'misc',
    initialState:Imisc = {
        online:true,
        systemDark:false,
        userMode:'system',
        sidebarOpen:null,
        authRequired:false,
        signedIn:false,
        loading:false,
        uid:'',
        fileTransferListOpen:false,
        indexeddbOK:false,
        isTouchScreen:false,
        websocketWorking:false,
        lastWebsocketOfflineTime:0,
        currentSessionStartTime:0,
        pageVisibility:false,
        username:'',
        maxChildTaskLvl:1,
        googleChartLoaded:false,
        routerAsPath:'',
        routerQuery:'',
        visitor:false,
    },
    miscSlice = createSlice({
        name:sliceName,
        initialState,
        reducers:{
            updateConnection(state:Imisc, {payload}: PayloadAction<boolean>){
                state.online = payload
            },
            systemIsDark(state:Imisc,{payload}:PayloadAction<boolean>){
                state.systemDark = payload
            },
            updateUserMode(state:Imisc,{payload}:PayloadAction<'dark'|'light'|'system'>){
                state.userMode = payload;
            },
            openSidebar(state:Imisc,{payload}:PayloadAction<boolean>){
                state.sidebarOpen = payload
            },
            isSignedOut(state:Imisc){
                state.signedIn = false
            },
            isSignedIn(state:Imisc){
                state.signedIn = true
            },
            updateLoading(state:Imisc,{payload}:PayloadAction<boolean>){
                state.loading = payload
            },
            updateFileTransferListOpenStatus(state:Imisc,{payload}:PayloadAction<boolean>){
                state.fileTransferListOpen = payload
            },
            indexeddbWorks(state:Imisc){
                state.indexeddbOK = true
            },
            updateTouchScreen(state:Imisc,{payload}:PayloadAction<boolean>){
                state.isTouchScreen = payload
            },
            websocketIsOn(state:Imisc){
                state.websocketWorking = true
            },
            websocketIsOff(state:Imisc,{payload}:PayloadAction<number>){
                state.websocketWorking = false
                state.lastWebsocketOfflineTime = payload
            },
            sessionRenewTime(state:Imisc,{payload}:PayloadAction<number>){
                state.currentSessionStartTime = payload
            },
            updatePageVisibility(state:Imisc,{payload}:PayloadAction<boolean>){
                state.pageVisibility = payload
            },
            updateUsername(state:Imisc,{payload}:PayloadAction<string>){
                state.username = payload
            },
            updateMaxChildTaskLvl(state:Imisc,{payload}:PayloadAction<number>){
                state.maxChildTaskLvl = payload
            },
            googleChartIsLoaded(state:Imisc){
                state.googleChartLoaded = true
            },
            updateRouterHistory(state:Imisc,{payload:{asPath,queryString}}:PayloadAction<{
                asPath:string;
                queryString:string;
            }>){
                state.routerAsPath = asPath;
                state.routerQuery = queryString;
            },
        }
    })

export const { 
    updateConnection, 
    systemIsDark,
    updateUserMode,
    openSidebar,
    isSignedOut,
    isSignedIn,
    updateLoading,
    updateFileTransferListOpenStatus,
    indexeddbWorks,
    updateTouchScreen,
    websocketIsOn,
    websocketIsOff,
    sessionRenewTime,
    updatePageVisibility,
    updateUsername,
    updateMaxChildTaskLvl,
    googleChartIsLoaded,
    updateRouterHistory,
} = miscSlice.actions
export { sliceName, initialState }
export default miscSlice.reducer