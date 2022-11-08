import { EntityId } from "@reduxjs/toolkit";

export interface UserDetails {
    id:EntityId;
    firstName:string;
    lastName:string;
    avatar:string;
    online:boolean;
}

export interface IoptionRawUser{
    id:string;
    avatar:string;
    firstName:string;
    lastName:string;
}