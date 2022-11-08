import { EntityId, Update } from "@reduxjs/toolkit";
import { Task, TaskComment, TaskField, TaskRecord } from "../interfaces";

export const ActionTypes = {
    addTask:'tasks_add-task' as 'tasks_add-task',
    addParentChildTask:'tasks_new-parent-child-task' as 'tasks_new-parent-child-task',
    editMainField:'tasks_edit-main-field' as 'tasks_edit-main-field',
    editExtraField:'tasks_edit-extra-field' as 'tasks_edit-extra-field',
    editCustomFieldConfig:'tasks_edit-custom-field-config' as 'tasks_edit-custom-field-config',
    deleteBoardColumn:'tasks_delete-board-column' as 'tasks_delete-board-column',
    updateTimer:'tasks_update-timer' as 'tasks_update-timer',
    addCustomeField:'tasks_add-custom-field' as 'tasks_add-custom-field',
    deleteCustomField:'tasks_delete-custom-field' as 'tasks_delete-custom-field',
    addComment:'tasks_add-comment' as 'tasks_add-comment',
    deleteComment:'tasks_delete-comment' as 'tasks_delete-comment',
    editTaskWithNewFiles:'tasks_edit-task-with-new-files' as 'tasks_edit-task-with-new-files',
    editComment:'tasks_edit-comment' as 'tasks_edit-comment',
    taskMovedInBoard:'tasks_task-moved-in-board' as 'tasks_task-moved-in-board',
    deleteTask:'tasks_delete-task' as 'tasks_delete-task',
    parentChildTask:'tasks_parent-child-task' as 'tasks_parent-child-task',
    updateParent:'tasks_update-parents' as 'tasks_update-parents',
}

export interface InewTaskPayload {
    task:Task;
    extraFieldObj:{[k:string]:any};
    files:{
        id:EntityId;
        name:string;
        size:number;
    }[];
}

export interface InewTaskAction {
    type: typeof ActionTypes.addTask;
    payload: InewTaskPayload;
    dt: number;
}

export interface IaddParentChildTaskAction {
    type: typeof ActionTypes.addParentChildTask;
    payload:Task;
    dt:number;
}

export interface IparentChildTaskPayload {
    taskID:EntityId;
    field:string;
    value:any;
}

export interface IparentChildTaskAction {
    type: typeof ActionTypes.parentChildTask;
    payload: IparentChildTaskPayload;
    dt : number;
}

export interface IeditMainTaskPayload {
    taskID:EntityId;
    field:string;
    value:any;
    taskRecord:TaskRecord;
}

export interface IeditMainTaskAction {
    type: typeof ActionTypes.editMainField;
    payload: IeditMainTaskPayload;
    dt : number;
}

export interface IeditExtraTaskPayload {
    taskID:EntityId;
    field:string;
    value:string;
}

export interface IeditExtraTaskAction {
    type: typeof ActionTypes.editExtraField;
    payload: IeditExtraTaskPayload;
    dt: number;
}

export interface IeditCustomFieldConfigPayload {
    id:EntityId;
    fieldName:string;
    details:Update<TaskField>;
}

export interface IeditCustomFieldConfigAction {
    type: typeof ActionTypes.editCustomFieldConfig;
    payload: IeditCustomFieldConfigPayload;
    dt: number;
}

export interface IdeleteBoardColumnPayload {
    boardColumnIdToDelete: EntityId;
    action:EntityId;
    newDefault:EntityId;
}

export interface IdeleteBoardColumnAction {
    type: typeof ActionTypes.deleteBoardColumn;
    payload:IdeleteBoardColumnPayload;
    dt:number;
}

export interface IupdateTimerPayload {
    userID:EntityId;
    time:number;
    endTimerID?:EntityId;
    startTaskID?:EntityId;
    newTimeRecordID?:EntityId;
}

export interface IupdateTimerAction {
    type: typeof ActionTypes.updateTimer;
    payload: IupdateTimerPayload;
    dt:number;
}

export interface IaddCustomFieldPayload {
    id:EntityId;
    fieldName:string;
    fieldType:EntityId;
    details:{
        default:any;
        options?:any[];
    }
}

export interface IaddCustomFieldAction {
    type: typeof ActionTypes.addCustomeField;
    payload: IaddCustomFieldPayload;
    dt: number;
}

export interface IdeleteCustomFieldPayload{
    fieldID:EntityId;
}

export interface IdeleteCustomFieldAction {
    type: typeof ActionTypes.deleteCustomField;
    payload: IdeleteCustomFieldPayload;
    dt:number;
}

export interface IaddCommentPayload {
    comment:TaskComment;
    files:{id:EntityId;name:string;size:number}[];
}

export interface IaddCommentAction {
    type: typeof ActionTypes.addComment;
    payload: IaddCommentPayload;
    dt:number;
}

export interface IdeleteCommentPayload {
    id:EntityId;
    time:number;
}

export interface IdeleteCommentAction {
    type: typeof ActionTypes.deleteComment;
    payload: IdeleteCommentPayload;
    dt: number;
}

export interface IeditTaskWithNewFilesPayload {
    taskID:EntityId;
    longTextMap:{[k:string]:string};
    privateFiles:{id:EntityId;name:string;size:number}[];
    uid:EntityId;
}

export interface IeditTaskWithNewFilesAction {
    type: typeof ActionTypes.editTaskWithNewFiles;
    payload: IeditTaskWithNewFilesPayload;
    dt:number;
}

export interface IeditCommentPayload {
    id:EntityId;
    editDt:number;
    content:string;
    privateFileIDs:EntityId[];
    newFiles:{id:EntityId;name:string;size:number}[];
}

export interface IeditCommentAction {
    type: typeof ActionTypes.editComment;
    payload: IeditCommentPayload;
    dt:number;
}

export interface ItaskMovedInBoardPayload {
    taskID:EntityId;
    newColumnID:EntityId;
    newIdxInColumn:number;
    active:boolean;
}

export interface ItaskMovedInBoardAction {
    type: typeof ActionTypes.taskMovedInBoard;
    payload:ItaskMovedInBoardPayload;
    dt:number;
}

export interface IdeleteTaskPayload {
    taskID:EntityId;
}

export interface IdeleteTaskAction {
    type: typeof ActionTypes.deleteTask;
    payload:IdeleteTaskPayload;
    dt:number;
}

export interface IupdateParentPayload {
    taskID:EntityId;
    parents:EntityId[];
}

export interface IupdateParentAction {
    type: typeof ActionTypes.updateParent;
    payload: IupdateParentPayload;
    dt:number;
}

export type ItasksActions = InewTaskAction 
    | IeditMainTaskAction
    | IeditExtraTaskAction
    | IeditCustomFieldConfigAction
    | IdeleteBoardColumnAction
    | IupdateTimerAction
    | IaddCustomFieldAction
    | IdeleteCustomFieldAction
    | IaddCommentAction
    | IdeleteCommentAction
    | IeditTaskWithNewFilesAction
    | IeditCommentAction
    | ItaskMovedInBoardAction
    | IdeleteTaskAction
    | IparentChildTaskAction
    | IaddParentChildTaskAction
    | IupdateParentAction