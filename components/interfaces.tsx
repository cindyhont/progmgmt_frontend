import { EntityId } from "@reduxjs/toolkit";

export interface Idept {
    id?:string;
    i:string;
    n:string;
}

export interface IstaffDetails {
    id:string;  // internal staff id
    fn:string;  // first name
    ln:string;  // last name
    t:string;   // title
    d:string;   // dept id
    e:string;   // email
    ur:number;  // user right
    s:string|null;   // supervisor
}

export interface IdeptHRM {
    id:string;
    internal_id:string;
    name:string;
    uploaded:boolean;
    selected:boolean;
    visible:boolean;
    updated:number;
}

export interface IdeptHrmFilter {
    id: string;
    field: ''|'internal_id' | 'name';
    operator: ''|'contains' | 'equals' | 'start_with' | 'end_with'
    value: string;
}

export interface IstaffDetailsHRM {
    uid:string;
    invitation_mail_key:string;
    staff_id:string;
    first_name:string;
    last_name:string;
    title:string;
    department:string;
    supervisor_id:string;
    user_right:number;
    email:string|null;
    inDB:boolean;
}

export interface FileDraft {
    id:EntityId;
    name:string;
    size:number;
    url:string;
    folder:'public'|'private';
    mimeType:string;
    grandParentID?:EntityId;
    parentID?:EntityId;
}