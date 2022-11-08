import { EntityId } from "@reduxjs/toolkit";

export const ActionTypes = {
    updateUserName:'settings_update-username' as 'settings_update-username',
    updateAvatar:'hrm_update-avatar' as 'hrm_update-avatar',
    updateMaxChildTaskLvl:'settings_update-max-child-task-lvl' as 'settings_update-max-child-task-lvl',
}

export interface IupdateUsernamePayload {
    username:string
}

export interface IupdateUserNameAction {
    type: typeof ActionTypes.updateUserName;
    payload: IupdateUsernamePayload;
    dt:number;
}

export interface IupdateAvatarPayload {
    avatar:string;
    user:EntityId;
}

export interface IupdateAvatarAction {
    type: typeof ActionTypes.updateAvatar;
    payload: IupdateAvatarPayload;
    dt:number;
}

export interface IupdateMaxChildTaskLvlPayload {
    maxChildTaskLvl:number;
    fromWS:boolean;
}

export interface IupdateMaxChildTaskLvlAction {
    type: typeof ActionTypes.updateMaxChildTaskLvl;
    payload: IupdateMaxChildTaskLvlPayload;
    dt:number;
}

export type IsettingsActions = IupdateUserNameAction
    | IupdateAvatarAction
    | IupdateMaxChildTaskLvlAction