import { EntityId, EntityState } from "@reduxjs/toolkit";

export interface TaskApproval {
    id:EntityId;
    name:string;
}

export interface TaskRecord {
    id:EntityId;
    taskID:EntityId;
    requester:EntityId;
    action:string;
    approval:EntityId;
    dt:number;
    addPersonnel:EntityId[];
    removePersonnel:EntityId[];
}

export interface TaskCustomFieldType {
    id:EntityId;
    typeName:string;
    listView:boolean;
    taskDetailsSidebar:boolean;
    inAddTask:boolean;
    customField:boolean;
    editInListView:boolean;
}

export interface TaskField {
    id:EntityId;
    fieldType:EntityId;
    fieldName:string;
    nameInDB?:string;
    details?:any;

    listWideScreenOrder:number;
    listNarrowScreenOrder:number;
    detailsSidebarOrder:number;
    detailsSidebarExpand:boolean;
}

export interface TaskComment {
    id:EntityId;
    taskID:EntityId;
    content:string;
    sender:EntityId;
    dt:number;
    replyMsgID:EntityId;
    replyMsg:string;
    replyMsgSender:EntityId;
    editDt:number;
    fileIDs:EntityId[];
    sent:boolean;
    deleted:boolean;
    deleteDT:number;
}

export interface TaskTimeRecord {
    id:EntityId;
    taskID:EntityId;
    uid:EntityId;
    start:number;
    end:number;
}

export interface TaskMaster {
    id:EntityId;
    name:string;
    description:string;
    createDT:number;
    startDT:number;
    deadlineDT:number;
    owner:EntityId;
    isGroupTask:boolean;
    supervisors:EntityId[];
    participants:EntityId[];
    viewers:EntityId[];
    trackTime:boolean;
    hourlyRate:number;
    fileIDs:EntityId[];
    filesToDelete:EntityId[];
    parents:EntityId[];
    sent:boolean;
    approval:EntityId;
    assignee:EntityId;
}

export type Task = TaskMaster & {
    [key:string]:any;
}

export interface Itask {
    tasks:EntityState<Task>;
    fields:EntityState<TaskField>;
    comments:EntityState<TaskComment>;
    approvalList:EntityState<TaskApproval>;
    customFieldTypes:EntityState<TaskCustomFieldType>;
    timeRecords:EntityState<TaskTimeRecord>;
    taskRecords:EntityState<TaskRecord>;
    ctxMenuFieldID:EntityId;
    ctxMenuTaskID:EntityId;
    ctxMenuBoardColumnID:EntityId;
    ctxMenuFileID:EntityId;
    editField:boolean;
    boardViewSmallScreenColumn:EntityId;
}