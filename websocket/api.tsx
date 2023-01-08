import chatWsHandlerApi from "@components/chat/reducers/ws-message-handler-api";
import { IchatActions, ActionTypes as ChatActionTypes } from "@components/chat/reducers/ws-message-types";
import settingsApi from "@components/settings/reducers/api";
import settingsWsHandlerApi from "@components/settings/reducers/ws-message-handler-api";
import { IsettingsActions, ActionTypes as SettingsActionTypes } from "@components/settings/reducers/ws-message-types";
import taskApi from "@components/tasks/reducers/api";
import taskWsHandlerApi from "@components/tasks/reducers/ws-message-handler-api";
import { ItasksActions, ActionTypes as TasksActionTypes } from "@components/tasks/reducers/ws-message-types";
import { AppDispatch } from "@reducers";
import apiSlice from "@reducers/api";
import { websocketIsOff, websocketIsOn } from "@reducers/misc";
import userDetailsApi from "@reducers/user-details/api";
import { IuserDetailsActions, ActionTypes as UserDetailsActionTypes } from "@reducers/user-details/ws-message-types";
import { EntityId } from "@reduxjs/toolkit";

let ws:WebSocket = null

export type IwsAction = IuserDetailsActions
    | IchatActions
    | ItasksActions
    | IsettingsActions

export const processWsMessage = async (msg:IwsAction,dispatch:AppDispatch) => {
    const {type,payload} = msg

    switch (type){
        case UserDetailsActionTypes.onlineUsers:
            await dispatch(userDetailsApi.endpoints.newOnlineUserList.initiate(payload)).unwrap();
            break;
        case UserDetailsActionTypes.userStatus:
            await dispatch(userDetailsApi.endpoints.newUserStatus.initiate(payload)).unwrap();
            break;
        case ChatActionTypes.typing:
            await dispatch(chatWsHandlerApi.endpoints.roomTyping.initiate(payload)).unwrap();
            break;
        case ChatActionTypes.pinned:
            await dispatch(chatWsHandlerApi.endpoints.updatePinned.initiate(payload)).unwrap()
            break;
        case ChatActionTypes.lastSeen:
            await dispatch(chatWsHandlerApi.endpoints.updateLastSeen.initiate(payload)).unwrap()
            break;
        case ChatActionTypes.markAsRead:
            await dispatch(chatWsHandlerApi.endpoints.updateMarkAsRead.initiate(payload)).unwrap()
            break;
        case ChatActionTypes.editConvo:
            await dispatch(chatWsHandlerApi.endpoints.convoEdited.initiate(payload)).unwrap()
            break;
        case ChatActionTypes.newConvo:
            await dispatch(chatWsHandlerApi.endpoints.newConvoAdded.initiate(payload)).unwrap();
            break;
        case ChatActionTypes.newRoomNoConvo:
            await dispatch(chatWsHandlerApi.endpoints.newRoomNoConvo.initiate(payload)).unwrap();
            break;
        case ChatActionTypes.newRoomWithConvo:
            await dispatch(chatWsHandlerApi.endpoints.newRoomWithConvo.initiate(payload)).unwrap();
            break;
        case ChatActionTypes.newGroup:
            await dispatch(chatWsHandlerApi.endpoints.newGroup.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.addTask:
            await dispatch(taskWsHandlerApi.endpoints.newTask.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.addParentChildTask:
            await dispatch(taskWsHandlerApi.endpoints.addNewParentChildTask.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.editCustomFieldConfig:
            await dispatch(taskWsHandlerApi.endpoints.editCustomFieldConfig.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.deleteBoardColumn:
            await dispatch(taskWsHandlerApi.endpoints.deleteBoardColumn.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.updateTimer:
            await dispatch(taskWsHandlerApi.endpoints.updateTimer.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.addCustomeField:
            await dispatch(taskWsHandlerApi.endpoints.addCustomField.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.deleteCustomField:
            await dispatch(taskWsHandlerApi.endpoints.deleteCustomField.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.addComment:
            await dispatch(taskWsHandlerApi.endpoints.addComment.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.deleteComment:
            await dispatch(taskWsHandlerApi.endpoints.deleteComment.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.editTaskWithNewFiles:
            await dispatch(taskWsHandlerApi.endpoints.editTaskWithNewFiles.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.editComment:
            await dispatch(taskWsHandlerApi.endpoints.editComment.initiate(payload)).unwrap()
            break;
        case TasksActionTypes.taskMovedInBoard:
            await dispatch(taskApi.endpoints.taskMovedInBoard.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.deleteTask:
            await dispatch(taskWsHandlerApi.endpoints.deleteTaskFromWS.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.editExtraField:
            await dispatch(taskWsHandlerApi.endpoints.editExtraField.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.editMainField:
            await dispatch(taskWsHandlerApi.endpoints.editMainField.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.parentChildTask:
            await dispatch(taskWsHandlerApi.endpoints.handleParentChildTask.initiate(payload)).unwrap();
            break;
        case TasksActionTypes.updateParent:
            await dispatch(taskWsHandlerApi.endpoints.updateParentsFromWS.initiate(payload)).unwrap();
            break;
        case SettingsActionTypes.updateUserName:
            await dispatch(settingsWsHandlerApi.endpoints.updateUsernameFromWS.initiate(payload)).unwrap();
            break;
        case SettingsActionTypes.updateAvatar:
            await dispatch(settingsWsHandlerApi.endpoints.updateAvatarFromWS.initiate(payload)).unwrap();
            break;
        case SettingsActionTypes.updateMaxChildTaskLvl:
            await dispatch(settingsApi.endpoints.updateMaxChildTaskLvl.initiate(payload)).unwrap();
            break;
    }
}

const
    WS_HOST = process.env.NEXT_PUBLIC_WS_URL,
    websocketApi = apiSlice.injectEndpoints({
        endpoints:build=>({
            sendWsMessage:build.mutation<any,{
                req?:string;
                reqs?:string[];
                roomid?:EntityId;
                typing?:boolean;
                uid?:EntityId;
            }>({
                queryFn(args){
                    if (!!ws && ws.readyState===1) ws.send(JSON.stringify(args))
                    return {data:null}
                }
            }),
            launchWS:build.query<any,void>({
                queryFn:() => ({data:null}),
                keepUnusedDataFor:0,
                async onCacheEntryAdded(_,{dispatch}){
                    const
                        connected = () => {
                            dispatch(websocketIsOn())
                            console.log('websocket is connected')
                        },
                        closeWS = (e:CloseEvent) => {
                            console.log(e)
                            dispatch(websocketIsOff(Date.now()))
                            if (!!ws){
                                ws.close()
                                ws = null
                                console.log('websocket is closed')
                            }
                        },
                        dispatchMessage = (rawStr:string) => processWsMessage(JSON.parse(rawStr) as IwsAction,dispatch)
                    try {
                        if (!ws) {
                            ws = new WebSocket(`${WS_HOST}/ws`)
                            ws.addEventListener('open',connected,{passive:true})
                            ws.addEventListener('error',e=>console.log(e),{passive:true})
                            ws.addEventListener('close',closeWS,{passive:true})
                            ws.addEventListener('message',e=>dispatchMessage(e.data),{passive:true})
                        }
                    } catch (error) {
                        console.log(error)
                    }
                }
            })
        })
    })

export const {
    useSendWsMessageMutation,
} = websocketApi
export default websocketApi