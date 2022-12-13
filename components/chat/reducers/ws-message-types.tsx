import { EntityId } from "@reduxjs/toolkit";

export const ActionTypes = {
    typing:'chat_typing' as 'chat_typing',
    pinned:'chat_pinned' as 'chat_pinned',
    lastSeen:'chat_lastseen' as 'chat_lastseen',
    markAsRead:'chat_markasread' as 'chat_markasread',
    editConvo:'chat_edit-convo' as 'chat_edit-convo',
    newConvo:'chat_new-convo' as 'chat_new-convo',
    newRoomNoConvo:'chat_new-room-no-convo' as 'chat_new-room-no-convo',
    newRoomWithConvo:'chat_new-room-w-convo' as 'chat_new-room-w-convo',
    newGroup:'chat_new-group' as 'chat_new-group',
}

export interface ItypingPayload {
    roomid:EntityId;
    uid:EntityId;
    typing:boolean;
}

export interface ItypingAction {
    type: typeof ActionTypes.typing;
    payload:ItypingPayload;
    dt:number;
}

export interface IpinnedPayload {
    pinned:boolean;
    roomid:EntityId;
}

export interface IpinnedAction {
    type: typeof ActionTypes.pinned;
    payload:IpinnedPayload;
}

export interface IlastSeenPayload {
    uid: EntityId;
    roomid:EntityId;
    lastseen:number;
}

export interface IlastSeenAction {
    type: typeof ActionTypes.lastSeen;
    payload:IlastSeenPayload;
}

export interface ImarkAsReadPayload {
    roomid:EntityId;
    markasread:number;
}

export interface ImarkAsReadAction {
    type:typeof ActionTypes.markAsRead;
    payload:ImarkAsReadPayload;
}

export interface IeditConvoPayload {
    roomid:EntityId;
    content:string;
    convoid:EntityId;
    editdt:number;
}

export interface IeditConvoAction {
    type: typeof ActionTypes.editConvo;
    payload: IeditConvoPayload;
}

export interface InewConvoPayload {
    id:EntityId,
    sender:EntityId,
    roomID:EntityId,
    content:string,
    replyMsgID:EntityId,
    replyMsg:string,
    replyMsgSender:EntityId,
    fileIDs:EntityId[];
    dt:number;
    files:{id:EntityId;name:string;size:number}[];
}

export interface InewConvoAction {
    type: typeof ActionTypes.newConvo;
    payload:InewConvoPayload;
}

export interface InewRoomNoConvoPayload {
    id:EntityId;
    users:EntityId[];
}

export interface InewRoomNoConvoAction {
    type: typeof ActionTypes.newRoomNoConvo;
    payload: InewRoomNoConvoPayload;
}

export interface InewRoomWithConvoPayload {
    roomID:EntityId;
    users:EntityId[];
    convoID:EntityId;
    content:string;
    sender:EntityId;
    dt:number;
}

export interface InewRoomWithConvoAction {
    type:typeof ActionTypes.newRoomWithConvo;
    payload:InewRoomWithConvoPayload;
}

export interface InewGroupPayload {
    roomID:EntityId;
    users:EntityId[];
    name:string;
    avatar:string;
}

export interface InewGroupAction {
    type: typeof ActionTypes.newGroup;
    payload: InewGroupPayload;
}

export type IchatActions = ItypingAction 
    | IpinnedAction
    | IlastSeenAction
    | ImarkAsReadAction
    | IeditConvoAction
    | InewConvoAction
    | InewRoomNoConvoAction
    | InewRoomWithConvoAction
    | InewGroupAction