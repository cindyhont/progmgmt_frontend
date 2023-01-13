import { ReduxState } from "@reducers";
import apiSlice, { fetchConfig } from "@reducers/api";
import { gFilesUpsertMany, GoogleFile } from "@reducers/google-download-api/slice";
import { isSignedOut } from "@reducers/misc";
import userDetailsApi from "@reducers/user-details/api";
import { UserDetails } from "@reducers/user-details/interfaces";
import { addUserDetailsStatusUnknown, userDetailsSelector } from "@reducers/user-details/slice";
import { EntityId } from "@reduxjs/toolkit";
import { Room } from "../interfaces";
import { 
    chatConvoSelector,
    chatRoomAddOne,
    chatRoomConvoAddOne,
    chatRoomConvoUpdate, 
    chatRoomSelector, 
    updateChatRoomStatus, 
    updateChatRoomUserStatus,
} from "./slice";
import { IeditConvoPayload, IlastSeenPayload, ImarkAsReadPayload, InewConvoPayload, InewGroupPayload, InewRoomNoConvoPayload, InewRoomWithConvoPayload, IpinnedPayload, ItypingPayload } from "./ws-message-types";

const 
    PATH = '/pm-api',
    chatWsHandlerApi = apiSlice.injectEndpoints({
        endpoints:build=>({
            roomTyping:build.mutation<any,ItypingPayload>({
                queryFn({roomid,uid,typing},{dispatch}){
                    dispatch(updateChatRoomUserStatus({roomID:roomid,entityChange:{id:uid,changes:{typing}}}))
                    return {data:null}
                }
            }),
            updatePinned:build.mutation<any,IpinnedPayload>({
                queryFn({roomid,pinned},{dispatch}){
                    dispatch(updateChatRoomStatus({id:roomid,changes:{pinned}}))
                    return {data:null}
                }
            }),
            updateLastSeen:build.mutation<any,IlastSeenPayload>({
                queryFn({roomid,uid,lastseen},{dispatch,getState}){
                    const thisUserID = (getState() as ReduxState).misc.uid
                    dispatch(updateChatRoomUserStatus({
                        roomID:roomid,
                        entityChange:{
                            id:uid,
                            changes:{lastSeen:lastseen}
                        }
                    }))
                    if (thisUserID===uid) dispatch(updateChatRoomStatus({id:roomid,changes:{markAsRead:0}}))
                    return {data:null}
                }
            }),
            updateMarkAsRead:build.mutation<any,ImarkAsReadPayload>({
                queryFn({roomid,markasread},{dispatch}){
                    dispatch(updateChatRoomStatus({id:roomid,changes:{markAsRead:markasread}}))
                    return {data:null}
                }
            }),
            convoEdited:build.mutation<any,IeditConvoPayload>({
                queryFn({roomid,convoid,content,editdt},{dispatch,getState}){
                    const 
                        state = getState() as ReduxState,
                        room = chatRoomSelector.selectById(state,roomid)
                    if (!!room){
                        const convo = chatConvoSelector.selectById(room,convoid)
                        if (!!convo) dispatch(chatRoomConvoUpdate({roomID:roomid,entityChange:{id:convoid,changes:{editDt:editdt,content}}}))
                    }
                    return {data:null}
                }
            }),
            newConvoAdded:build.mutation<any,InewConvoPayload>({
                async queryFn(
                    {
                        id,
                        sender,
                        roomID,
                        content,
                        replyMsgID,
                        replyMsg,
                        replyMsgSender,
                        fileIDs,
                        dt,
                        files
                    },
                    {
                        dispatch,
                        getState,
                    },
                    _extra,
                    baseQuery
                ){
                    const 
                        state = getState() as ReduxState,
                        roomIsInList = chatRoomSelector.selectIds(state).includes(roomID),
                        addConvo = (roomid:EntityId) => dispatch(chatRoomConvoAddOne({
                            roomID:roomid,
                            convo:{
                                id,
                                sender,
                                content,
                                replyMsg,
                                replyMsgID,
                                replyMsgSender,
                                dt,
                                fileIDs,
                                editDt:0,
                                error:false,
                                sent:true,
                            }
                        }));
                    if (roomIsInList) {
                        const 
                            existingUserIDs = userDetailsSelector.selectIds(state),
                            missingUsers = [sender,replyMsgSender].filter(e=>!existingUserIDs.includes(e))
                        if (!!missingUsers.length) await dispatch(userDetailsApi.endpoints.fetchUsers.initiate(missingUsers)).unwrap()
                        if (!!files.length) dispatch(gFilesUpsertMany(files.map(f=>({
                            ...f,
                            downloading:false,
                            progress:0,
                            error:false,
                            url:'',
                        }))))
                        addConvo(roomID)
                    } else {
                        try {
                            const result = await baseQuery(fetchConfig(`${PATH}/chat/fetch-specific-rooms`,'POST',{roomIDs:[roomID]}))
                            if (!!result?.error){
                                if (result?.error?.status===401) dispatch(isSignedOut())
                                return {data:null}
                            }
                            const data = result.data as {rooms:Room[];users:UserDetails[];files:GoogleFile[];}
                            if (!!data.files.length) dispatch(gFilesUpsertMany(data.files))
                            if (!!data.users.length) dispatch(addUserDetailsStatusUnknown(data.users.map(({id,firstName,lastName,avatar})=>({id,firstName,lastName,avatar}))))
                            if (!!data.rooms.length && data.rooms[0].id===roomID) {
                                dispatch(chatRoomAddOne({
                                    id:roomID,
                                    users:data.rooms[0].users.ids,
                                    name:data.rooms[0].name,
                                    avatar:data.rooms[0].avatar,
                                    isGroup:data.rooms[0].isGroup,
                                }))
                                addConvo(roomID)
                            }
                        } catch {}
                    }
                    return {data:null}
                }
            }),
            newRoomNoConvo:build.mutation<any,InewRoomNoConvoPayload>({
                queryFn({id,users},{dispatch}){
                    dispatch(chatRoomAddOne({
                        id,
                        users,
                        name:'',
                        avatar:'',
                        isGroup:false,
                    }))
                    return {data:null}
                }
            }),
            newRoomWithConvo:build.mutation<any,InewRoomWithConvoPayload>({
                queryFn({
                    roomID,
                    users,
                    convoID,
                    content,
                    sender,
                    dt,
                },{dispatch}){
                    dispatch(chatRoomAddOne({
                        id:roomID,
                        users,
                        name:'',
                        avatar:'',
                        isGroup:false,
                    }))
                    dispatch(chatRoomConvoAddOne({
                        roomID,
                        convo:{
                            id:convoID,
                            content,
                            replyMsgID:'',
                            fileIDs:[],
                            sender,
                            dt,
                            replyMsg:'',
                            replyMsgSender:'',
                            editDt:0,
                            error:false,
                            sent:true
                        }
                    }))
                    return {data:null}
                }
            }),
            newGroup:build.mutation<any,InewGroupPayload>({
                queryFn({
                    roomID,
                    users,
                    name,
                    avatar,
                },{dispatch}){
                    dispatch(chatRoomAddOne({
                        id:roomID,
                        users,
                        name,
                        avatar,
                        isGroup:true,
                    }))
                    return {data:null}
                }
            })
        })
    })

export default chatWsHandlerApi