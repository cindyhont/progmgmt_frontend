import { FileDraft } from "@components/interfaces";
import { IoptionRawUser } from "@reducers/user-details/interfaces";
import { EntityId, EntityState } from "@reduxjs/toolkit";

export interface Ichat {
    contextMenuID:EntityId;
    rooms:EntityState<Room>;
    users:EntityState<User>;
}

export interface Convo {
    id:EntityId;
    content:string;
    sender:EntityId;
    dt:number;
    replyMsgID:EntityId;
    replyMsg:string;
    replyMsgSender:EntityId;
    editDt:number;
    error:boolean;
    sent:boolean;
    fileIDs:EntityId[];
}

export interface RoomUser {
    id:EntityId;
    typing:boolean;
    lastSeen:number;
}

export interface User {
    id:EntityId;
    draft:string;
    fileInputs:EntityState<FileDraft>;
}

export interface Room {
    id:EntityId;

    users: EntityState<RoomUser>;
    convos:EntityState<Convo>;
    fileInputs:EntityState<FileDraft>;

    name:string;
    avatar:string;
    isGroup:boolean;
    markAsRead:number;
    pinned:boolean;
    scrollY:number; // this is the entire chat logs' bounding rect top
    viewportLatestConvoID:EntityId;

    draft:string;
    replyMsgID:EntityId;
    reply:boolean;
    editMsgID:EntityId;
    edit:boolean;

    hasMoreConvos:boolean;
    fetchingConvos:boolean;
}

// interfaces for searching users / groups

export interface Ioption {
    id:string;
    rid:string;
    uid:string;
    avatar:string;
    name:string;
    isGroup?:boolean;
}

export interface IoptionRawRoom {
    rid:string;
    avatar:string;
    name:string;
    isGroup:boolean;
}

export interface IoptionRaw {
    rooms:IoptionRawRoom[];
    users:IoptionRawUser[];
}