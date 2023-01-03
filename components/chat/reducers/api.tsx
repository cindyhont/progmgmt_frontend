import { ReduxState } from "@reducers";
import apiSlice, { fetchConfig } from "@reducers/api";
import { isSignedOut, sessionRenewTime, updateLoading } from "@reducers/misc";
import { 
    Convo,
    Ioption, 
    IoptionRawRoom,
    Room,
} from "../interfaces";
import { 
    chatConvoSelector, 
    chatRoomAddOne, 
    chatRoomConvoAddOne, 
    chatRoomConvoUpdate, 
    chatRoomConvoUpsertMany, 
    chatRoomFileInputSetAll, 
    chatRoomSelector, 
    chatRoomUpsertMany, 
    chatUserFileInputSetAll, 
    chatUserSelector, 
    updateChatRoomStatus, 
    updateChatRoomUserStatus, 
    updateChatUserStatus,
} from "./slice";
import {v4 as uuidv4} from 'uuid'
import googleUploadApi from "@reducers/google-upload-api";
import { GoogleFilePrelim, googleFilePrelimSelector } from "@reducers/google-upload-api/slice";
import { gFilesUpsertMany, GoogleFile } from "@reducers/google-download-api/slice";
import { EntityId } from "@reduxjs/toolkit";
import { addUserDetailsStatusUnknown, userDetailsUpsertMany } from "@reducers/user-details/slice";
import { UserDetails } from "@reducers/user-details/interfaces";
import { FileDraft } from "@components/interfaces";
import { fileInputSelector } from "@components/functions";
import websocketApi from "websocket/api";

const
    PATH = '/api',
    chatApi = apiSlice.injectEndpoints({
        endpoints:(build)=>({
            searchChatrooms:build.mutation<Ioption[],string>({
                async queryFn(queryStr,{dispatch},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/search-chatrooms/${encodeURIComponent(queryStr)}`,'GET'))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:[]}
                        }
                        const data = result.data as {
                            rooms:IoptionRawRoom[];
                            users:{
                                uid:string;
                                firstName:string;
                                lastName:string;
                                avatar:string;
                            }[]
                        }
                        dispatch(addUserDetailsStatusUnknown(data.users.map(ud=>({
                            id:ud.uid,
                            avatar:ud.avatar,
                            firstName:ud.firstName,
                            lastName:ud.lastName
                        }))))
                        dispatch(sessionRenewTime(start))
                        return {
                            data:[
                                ...data.rooms.map(({rid,avatar,name,isGroup})=>({rid,avatar,name,isGroup,id:rid,uid:''})),
                                ...data.users.map(({uid,avatar,firstName,lastName})=>({
                                    rid:'',
                                    uid,
                                    avatar,
                                    name:`${firstName} ${lastName}`.trim(),
                                    id:uid,
                                    isGroup:false
                                }))
                            ]
                        }
                    } catch {}
                    return {data:[]}
                }
            }),
            fetchMoreRooms:build.mutation<any,void>({
                async queryFn(_,{dispatch,getState},_extra,baseQuery){
                    const
                        state = getState() as ReduxState,
                        roomIDs = chatRoomSelector.selectIds(state)

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-more-rooms`,'POST',{roomIDs}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:null}
                        } 
                        const data = result.data as {
                            rooms:Room[];
                            users:UserDetails[];
                            files:GoogleFile[];
                        }
                        dispatch(gFilesUpsertMany(data.files))
                        dispatch(userDetailsUpsertMany(data.users))
                        dispatch(chatRoomUpsertMany(data.rooms))
                        dispatch(sessionRenewTime(start))
                        return {data:true}
                    } catch {}
                    return {data:null}
                }
            }),
            dispatchConvos:build.mutation<any,{
                roomID:EntityId;
                convos:Convo[];
                hasMoreConvos:boolean;
                users:UserDetails[];
                files:{id:EntityId;name:string;size:number}[];
            }>({
                queryFn({roomID,convos,hasMoreConvos,users,files},{dispatch}){
                    dispatch(updateChatRoomStatus({id:roomID,changes:{fetchingConvos:false}}))

                    if (!!files.length) dispatch(gFilesUpsertMany(files.map(e=>({
                        ...e,
                        downloading:false,
                        error:false,
                        progress:0,
                        url:''
                    }))))
                    if (!!users.length) dispatch(addUserDetailsStatusUnknown(users.map(e=>({
                        firstName:e.firstName,
                        lastName:e.lastName,
                        avatar:e.avatar,
                        id:e.id
                    }))))
                    if (!hasMoreConvos) dispatch(updateChatRoomStatus({id:roomID,changes:{hasMoreConvos:false}}))
                    if (!!convos.length) dispatch(chatRoomConvoUpsertMany({roomID,convos}))

                    return {data:null}
                }
            }),
            fetchMoreConvos:build.mutation<any,EntityId>({
                async queryFn(roomID,{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        room = chatRoomSelector.selectById(state,roomID),
                        convos = chatConvoSelector.selectAll(room),
                        oldestConvo = convos.sort((a,b)=>a.dt - b.dt)[0],
                        start = Date.now()

                    dispatch(updateChatRoomStatus({id:roomID,changes:{fetchingConvos:true}}))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-more-convos`,'POST',{roomID,lastConvoID:oldestConvo.id}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {
                            convos:Convo[];
                            hasMoreConvos:boolean;
                            users:UserDetails[];
                            files:{id:EntityId;name:string;size:number}[];
                        }
                        dispatch(chatApi.endpoints.dispatchConvos.initiate({roomID,...data}))
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    
                    return {data:null}
                }
            }),
            fetchRepliedConvosAtInit:build.mutation<any,EntityId>({
                async queryFn(roomID,{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        room = chatRoomSelector.selectById(state,roomID)
                    if (!room || !room.hasMoreConvos) return {data:null}
                    const convoLen = chatConvoSelector.selectTotal(room)
                    if (convoLen > 20 || !convoLen) return {data:null}
                    const 
                        allConvos = chatConvoSelector.selectAll(room),
                        convosWithReply = allConvos.filter(e=>!!e.replyMsgID)
                    if (!convosWithReply.length) return {data:null}
                    const 
                        replyIDs = convosWithReply.map(e=>e.replyMsgID),
                        allConvoIDs = allConvos.map(e=>e.id),
                        replyIDsNoConvo = replyIDs.filter(e=>!allConvoIDs.includes(e))
                    if(!replyIDsNoConvo.length) return {data:null}
                    const 
                        oldestConvoID = convoLen===1 ? allConvos[0].id : allConvos.sort((a,b)=>a.dt - b.dt)[0].id,
                        start = Date.now()

                    dispatch(updateChatRoomStatus({id:roomID,changes:{fetchingConvos:true}}))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-replied-convos`,'POST',{roomID,convoIDs:[...replyIDsNoConvo,oldestConvoID]}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {
                            convos:Convo[];
                            hasMoreConvos:boolean;
                            users:UserDetails[];
                            files:{id:EntityId;name:string;size:number}[];
                        }
                        dispatch(chatApi.endpoints.dispatchConvos.initiate({roomID,...data}))
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    return {data:null}
                }
            }),
            fetchRepliedConvos:build.mutation<any,{
                roomID:EntityId;
                convoID:EntityId;
            }>({
                async queryFn({roomID,convoID},{dispatch,getState},_,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        room = chatRoomSelector.selectById(state,roomID),
                        allConvos = chatConvoSelector.selectAll(room),
                        oldestConvoID = allConvos.length===1 ? allConvos[0].id : allConvos.sort((a,b)=>a.dt - b.dt)[0].id,
                        start = Date.now()
                    
                    dispatch(updateChatRoomStatus({id:roomID,changes:{fetchingConvos:true}}))

                    try {
                        const result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-replied-convos`,'POST',{roomID,convoIDs:[convoID,oldestConvoID]}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {
                            convos:Convo[];
                            hasMoreConvos:boolean;
                            users:UserDetails[];
                            files:{id:EntityId;name:string;size:number}[];
                        }
                        dispatch(chatApi.endpoints.dispatchConvos.initiate({roomID,...data}))
                        dispatch(sessionRenewTime(start))
                    } catch {}

                    return {data:null}
                }
            }),
            fetchSpecificRooms:build.mutation<any,string[]>({
                async queryFn(roomIDs,{dispatch},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-specific-rooms`,'POST',{roomIDs}))
                        if (!!result?.error){
                            if (result?.error?.status===401) dispatch(isSignedOut())
                            return {data:null}
                        } 
                        const data = result.data as {
                            rooms:Room[];
                            users:UserDetails[];
                            files:GoogleFile[];
                        }
                        dispatch(gFilesUpsertMany(data.files))
                        dispatch(userDetailsUpsertMany(data.users))
                        dispatch(chatRoomUpsertMany(data.rooms))
                        dispatch(sessionRenewTime(start))
                        return {data:true}
                    } catch {}
                    return {data:null}
                }
            }),
            updateChatLastSeen:build.mutation<any,EntityId>({
                query(rid){
                    return fetchConfig(`${PATH}/chat/update-last-seen/${rid}`,'GET')
                },
                async onQueryStarted(rid,{ dispatch, getState, queryFulfilled }){
                    const uid = (getState() as ReduxState).misc.uid
                   
                    dispatch(updateChatRoomUserStatus({
                        roomID:rid,
                        entityChange:{
                            id:uid,
                            changes:{lastSeen:Date.now()}
                        }
                    }))
                    dispatch(updateChatRoomStatus({id:rid,changes:{markAsRead:0}}))
                    try {
                        const 
                            start = Date.now(),
                            {data} = await queryFulfilled,
                            {wsid} = data as {wsid:string}

                        dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            updateChatPinned:build.mutation<any,{rid:EntityId;pinned:boolean;}>({
                query({rid,pinned}){
                    return fetchConfig(`${PATH}/chat/update-pinned`,'POST',{rid,pinned})
                },
                async onQueryStarted({rid,pinned},{ dispatch, queryFulfilled }){
                    dispatch(updateChatRoomStatus({id:rid,changes:{pinned}}))
                    try {
                        const 
                            start = Date.now(),
                            {data} = await queryFulfilled,
                            {wsid} = data as {wsid:string}
                        dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            updateChatMarkAsRead:build.mutation<any,{rid:EntityId;markAsRead:number}>({
                query({rid,markAsRead}){
                    return fetchConfig(`${PATH}/chat/update-mark-as-read`,'POST',{rid,markAsRead})
                },
                async onQueryStarted({rid,markAsRead},{ dispatch, queryFulfilled }){
                    dispatch(updateChatRoomStatus({id:rid,changes:{markAsRead}}))
                    try {
                        const 
                            start = Date.now(),
                            {data} = await queryFulfilled,
                            {wsid} = data as {wsid:string}
                        dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch (err) {
                        if (err.error.status === 401) dispatch(isSignedOut())
                    }
                }
            }),
            editChatMessage:build.mutation<any,{
                msg:string;
                roomID:EntityId;
            }>({
                async queryFn({msg,roomID}, {dispatch,getState}, _, baseQuery){
                    const 
                        state = getState() as ReduxState,
                        editMsgID = chatRoomSelector.selectById(state,roomID).editMsgID,
                        originalEditDT = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),editMsgID).editDt,
                        originalContent = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),editMsgID).content

                    dispatch(chatRoomConvoUpdate({roomID,entityChange:{id:editMsgID,changes:{editDt:Date.now(),content:msg}}}))
                    dispatch(updateChatRoomStatus({id:roomID,changes:{edit:false}}))

                    try {
                        const
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/edit-convo`,'POST',{id:editMsgID,content:msg}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {success:boolean;wsid:string;}
                        if (!data.success) dispatch(chatRoomConvoUpdate({roomID,entityChange:{id:editMsgID,changes:{editDt:originalEditDT,content:originalContent}}}))
                        else dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch {}

                    return {data:null}
                }
            }),
            createUploadFilePreConvo:build.mutation<any,{
                roomID:EntityId;
                message:string;
                files:FileDraft[];
            }>({
                queryFn({roomID,message,files},{dispatch,getState}){
                    const 
                        convoID = uuidv4() as EntityId,
                        state = getState() as ReduxState,
                        uid = state.misc.uid,
                        googleFiles:GoogleFilePrelim[] = files.map(f=>({
                            id:f.id,
                            parentType:'chat',
                            googleFileID:'',
                            uploadEndpoint:'',
                            parentID:convoID,
                            grandParentID:roomID,
                            dataUrl:f.url,
                            fileName:f.name,
                            fileSize:f.size,
                            uploaded:0,
                            uploading:false,
                            error:false,
                            mimeType:f.mimeType,
                            folder:'private',
                        }))

                    dispatch(googleUploadApi.endpoints.addNewGoogleFiles.initiate(googleFiles))

                    const convo:Convo = {
                        id:convoID,
                        content:message,
                        sender:uid,
                        dt:Date.now(),
                        replyMsgID:'',
                        replyMsg:'',
                        replyMsgSender:'',
                        editDt:0,
                        error:false,
                        sent:false,
                        fileIDs:files.map(({id})=>id)
                    }
                    dispatch(chatRoomConvoAddOne({roomID,convo}))
                    return {data:null}
                }
            }),
            chatAttachmentUploaded:build.mutation<any,EntityId>({
                async queryFn(internalFileID,{dispatch,getState},_,baseQuery){
                    const
                        state = getState() as ReduxState,
                        file = googleFilePrelimSelector.selectById(state,internalFileID),
                        convoID = file.parentID,
                        roomID = file.grandParentID,
                        files = googleFilePrelimSelector.selectAll(state),
                        filesThisConvo = files.filter(f=>f.parentID===convoID),
                        allFilesUploaded = filesThisConvo.every(f=>f.googleFileID!=='')

                    if (!allFilesUploaded) return {data:null}

                    let convo = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),convoID)
                    if (!convo) return {data:null}

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/create-convo`,'POST',{
                                rid:roomID,
                                convo:{...convo,fileIDs:filesThisConvo.map(({googleFileID})=>googleFileID)},
                                files:filesThisConvo.map(f=>({id:f.googleFileID,name:f.fileName,size:f.fileSize}))
                            }))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const {wsid,success} = result.data as {wsid:string;success:boolean}
                        if (success) dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch {}

                    return {data:null}
                }
            }),
            createConvoInExistingRoom:build.mutation<any,{
                msg:string;
                roomID:EntityId;
            }>({
                async queryFn({msg,roomID}, {dispatch,getState}, _, baseQuery){
                    const 
                        state = getState() as ReduxState,
                        {uid} = state.misc,
                        {replyMsgID,reply,editMsgID,edit,fileInputs} = chatRoomSelector.selectById(state,roomID)

                    if (fileInputSelector.selectTotal(fileInputs)!==0) {
                        dispatch(
                            chatApi.endpoints.createUploadFilePreConvo.initiate({
                                roomID,
                                message:msg,
                                files:fileInputSelector.selectAll(fileInputs)
                            })
                        )
                        dispatch(chatRoomFileInputSetAll({files:[],roomID}))
                        return {data:null}
                    }

                    if (!!edit && !!editMsgID) {
                        dispatch(chatApi.endpoints.editChatMessage.initiate({msg,roomID}))
                        return {data:null}
                    }

                    let replyMsg = '', replyMsgSender:EntityId = ''
                    if (!!reply) {
                        dispatch(updateChatRoomStatus({id:roomID,changes:{reply:false,draft:''}}))
                        replyMsg = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),replyMsgID).content
                        replyMsgSender = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),replyMsgID).sender
                    }

                    const convo:Convo = {
                        id:uuidv4(),
                        content:msg,
                        replyMsgID:!!reply ? replyMsgID : '',
                        fileIDs:[],
                        sender:uid,
                        dt:Date.now(),
                        replyMsg,
                        replyMsgSender,
                        editDt:0,
                        error:false,
                        sent:true
                    }

                    dispatch(chatRoomConvoAddOne({
                        roomID,
                        convo
                    }))

                    dispatch(updateChatRoomStatus({id:roomID,changes:{draft:''}}))
                    
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/create-convo`,'POST',{rid:roomID,convo,files:[]}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {wsid:string;success:boolean;}
                        
                        if (!data.success) {
                            dispatch(chatRoomConvoUpdate({
                                roomID,
                                entityChange:{id:convo.id,changes:{error:true}}
                            }))
                            return {data:null}
                        }
                        if (data.success) dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    return {data:null}
                }
            }),
            createRoomNoConvo:build.mutation<any,{
                msg:string;
                userID:EntityId;
            }>({
                async queryFn({msg,userID},{dispatch,getState},_extra,baseQuery){
                    const 
                        state = getState() as ReduxState,
                        {uid} = state.misc,
                        {fileInputs} = chatUserSelector.selectById(state,userID)

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/create-room-no-convo/${userID}`,'GET'))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const data = result.data as {rid:EntityId;success:boolean;wsid:string;}
                        if (data.success){
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:data.wsid}))

                            dispatch(chatRoomAddOne({
                                id:data.rid,
                                users:[userID,uid],
                                name:'',
                                avatar:'',
                                isGroup:false,
                            }))
                            dispatch(chatUserFileInputSetAll({files:[],userID}))
                            dispatch(
                                chatApi.endpoints.createUploadFilePreConvo.initiate({
                                    roomID:data.rid,
                                    message:msg,
                                    files:fileInputSelector.selectAll(fileInputs)
                                })
                            )
                            dispatch(sessionRenewTime(start))
                            return {data:data.rid}
                        }
                        dispatch(sessionRenewTime(start))
                    } catch {}
                    return {data:null}
                }
            }),
            createRoomWithFirstConvo:build.mutation<any,{
                msg:string;
                userID:EntityId;
            }>({
                async queryFn({msg,userID}, {dispatch,getState}, _, baseQuery){
                    const 
                        state = getState() as ReduxState,
                        {uid} = state.misc

                    const
                        convo = {
                            id:uuidv4(),
                            content:msg,
                            replyMsgID:'',
                            fileIDs:[]
                        }

                    dispatch(updateChatUserStatus({id:userID,changes:{draft:''}}))

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/create-room-with-first-convo`,'POST',{convo,roommateID:userID}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const {roomSuccess,convoSuccess,rid,wsid} = result.data as {
                            rid:string;
                            roomSuccess:boolean;
                            convoSuccess:boolean;
                            wsid:string;
                        }

                        if (roomSuccess && convoSuccess){
                            dispatch(chatRoomAddOne({
                                id:rid,
                                users:[userID,uid],
                                name:'',
                                avatar:'',
                                isGroup:false,
                            }))
                            dispatch(chatRoomConvoAddOne({
                                roomID:rid,
                                convo:{
                                    id:convo.id,
                                    content:msg,
                                    replyMsgID:'',
                                    fileIDs:[],
                                    sender:uid,
                                    dt:Date.now(),
                                    replyMsg:'',
                                    replyMsgSender:'',
                                    editDt:0,
                                    error:false,
                                    sent:true
                                }
                            }))
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))
                            dispatch(sessionRenewTime(start))
                            return {data:rid}
                        }
                    } catch {}

                    return {data:null}
                }
            }),
            // createChatConvo:build.mutation<any,{
            //     msg:string;
            //     roomID?:EntityId;
            //     userID?:EntityId;
            // }>({
            //     queryFn({msg,roomID,userID}, {dispatch}) {
            //         if (!!roomID) dispatch(chatApi.endpoints.createConvoInExistingRoom.initiate({msg,roomID}))
            //         else dispatch(chatApi.endpoints.createRoomWithFirstConvo.initiate({msg,userID}))
            //         return {data:null}
            //     },
            // }),
            createGroup:build.mutation<any,{
                name:string;
                avatar:string;
                uids:EntityId[];
            }>({
                async queryFn({name,avatar,uids},{dispatch,getState},_,baseQuery){
                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/create-group`,'POST',{name,avatar,uids}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const 
                            {uid} = (getState() as ReduxState).misc,
                            {data} = result,
                            {success,roomID,wsid} = data as {success:boolean;roomID:EntityId;wsid:string;}
                        if (!!success) {
                            dispatch(websocketApi.endpoints.sendWsMessage.initiate({req:wsid}))

                            dispatch(chatRoomAddOne({
                                id:roomID,
                                users:Array.from(new Set([...uids,uid])),
                                name,
                                avatar,
                                isGroup:true,
                            }))
                            dispatch(updateLoading(false))
                            dispatch(sessionRenewTime(start))
                            return {data:{success,roomID}}
                        }
                    } catch {}
                    dispatch(updateLoading(false))
                    return {data:null}
                }
            }),
            forwardConvo:build.mutation<any,Ioption[]>({
                async queryFn(args,{dispatch,getState}, _, baseQuery){
                    const 
                        state = getState() as ReduxState,
                        chatState = state.chat,
                        convoID = chatState.contextMenuID,
                        rooms = args.filter(e=>!!e.rid).map(({rid})=>({id:rid,cid:uuidv4()})),
                        users = args.filter(e=>!!e.uid).map(({uid})=>({id:uid,cid:uuidv4()})),
                        {uid} = state.misc

                    try {
                        const 
                            start = Date.now(),
                            result = await baseQuery(fetchConfig(`${PATH}/chat/forward-convo`,'POST',{convoID,rooms,users}))
                        if (result?.error?.status===401){
                            dispatch(isSignedOut())
                            return {data:null}
                        }
                        const {success,content,fileIDs,rooms:finalRooms,wsids} = result.data as {
                            success:boolean;
                            content:string;
                            fileIDs:string[];
                            rooms:{id:EntityId;cid:EntityId;uid:EntityId;}[];
                            wsids:string[]
                        }
                        if (!success) return {data:null}

                        dispatch(websocketApi.endpoints.sendWsMessage.initiate({reqs:wsids}))

                        const 
                            len = finalRooms.length,
                            currentRoomIDs = chatRoomSelector.selectIds(state)
                        for (let i=0; i<len; i++){
                            const 
                                roomID = finalRooms[i].id,
                                notInIdList = currentRoomIDs.indexOf(roomID) === -1

                            if (notInIdList) dispatch(chatRoomAddOne({
                                id:roomID,
                                users:[finalRooms[i].uid,uid],
                                name:'',
                                avatar:'',
                                isGroup:false,
                            }))

                            dispatch(chatRoomConvoAddOne({
                                roomID,
                                convo:{
                                    id:finalRooms[i].cid,
                                    content:content,
                                    replyMsgID:'',
                                    fileIDs,
                                    sender:uid,
                                    dt:Date.now(),
                                    replyMsg:'',
                                    replyMsgSender:'',
                                    editDt:0,
                                    error:false,
                                    sent:true
                                }
                            }))
                        }
                        dispatch(sessionRenewTime(start))
                    } catch {}

                    return {data:null}
                }
            }),
            
        })
    })

export const {
    useSearchChatroomsMutation,
    useUpdateChatLastSeenMutation,
    useUpdateChatPinnedMutation,
    useUpdateChatMarkAsReadMutation,
    useForwardConvoMutation,
    useCreateConvoInExistingRoomMutation,
    useCreateRoomWithFirstConvoMutation,
    useCreateRoomNoConvoMutation,
    useFetchMoreRoomsMutation,
    useFetchSpecificRoomsMutation,
    useFetchMoreConvosMutation,
    useFetchRepliedConvosAtInitMutation,
    useFetchRepliedConvosMutation,
} = chatApi
export default chatApi