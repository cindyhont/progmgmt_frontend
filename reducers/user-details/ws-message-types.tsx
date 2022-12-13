import { EntityId } from "@reduxjs/toolkit";

export const ActionTypes = {
    onlineUsers:'online-users' as 'online-users',
    userStatus:'user-status' as 'user-status'
}

export const UserDetailsActionTypeList = Object.values(ActionTypes)

export interface IupdateOnlineUsersAction {
    type: typeof ActionTypes.onlineUsers;
    payload:{
        ids:EntityId[];
    };
}

export interface IupdateUserStatusAction {
    type: typeof ActionTypes.userStatus;
    payload:{
        id:EntityId;
        online:boolean;
    };
}

export type IuserDetailsActions = IupdateOnlineUsersAction 
    | IupdateUserStatusAction