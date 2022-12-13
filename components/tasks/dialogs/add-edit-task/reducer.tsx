import { FileDraft } from "@components/interfaces";
import { Task } from "@components/tasks/interfaces";
import { EntityId } from "@reduxjs/toolkit";
import { Dayjs } from 'dayjs';

const 
    ActionTypes = {
        editTextField:'editTextField' as 'editTextField',
        toggleAccordion:'toggleAccordion' as 'toggleAccordion',
        editDate:'editDate' as 'editDate',
        editNumeral:'editNumeral' as 'editNumeral',
        editStringArray:'editStringArray' as 'editStringArray',
        editFiles:'editFiles' as 'editFiles',
        deleteFile:'deleteFile' as 'deleteFile',
        upsertObj:'upsertObj' as 'upsertObj',
    },
    keys = {
        'withTimeFrame':'withTimeFrame' as 'withTimeFrame',
        'isGroupTask':'isGroupTask' as 'isGroupTask',
        'trackTime':'trackTime' as 'trackTime',
        'hasFiles':'hasFiles' as 'hasFiles',
        'files':'files' as 'files',
    }

export interface TaskEdit extends Task {
    withTimeFrame:boolean;
    hourlyRate_edit:string;
    parent:string;

    startDT_edit:Dayjs|null;
    deadlineDT_edit:Dayjs|null;

    hasFiles:boolean;
    files:FileDraft[];
}

export interface IupsertObjAction {
    type: typeof ActionTypes.upsertObj;
    payload:{
        [k:string]:any;
    };
}

export interface IdeleteFileAction {
    type: typeof ActionTypes.deleteFile;
    payload: EntityId;
}
 
export interface IeditFilesPayload {
    key:typeof keys.files;
    value:FileDraft[];
}

export interface IeditFilesAction {
    type:typeof ActionTypes.editFiles;
    payload:IeditFilesPayload;
}

export interface IeditTextFieldPayload {
    key:string;
    value:string;
}

export interface IeditTextFieldAction {
    type:typeof ActionTypes.editTextField;
    payload:IeditTextFieldPayload;
}

export interface IeditStringArrayPayload {
    key:string;
    value:string[];
}

export interface IeditStringArrayAction {
    type:typeof ActionTypes.editStringArray;
    payload:IeditStringArrayPayload;
}

export interface IeditDatePayload {
    key:string;
    value:Dayjs|null;
}

export interface IeditDateAction {
    type:typeof ActionTypes.editDate;
    payload:IeditDatePayload;
}

export interface ItoggleAccordionPayload {
    key:typeof keys.withTimeFrame | typeof keys.isGroupTask | typeof keys.trackTime | typeof keys.hasFiles;
    value:boolean;
}

export interface ItoggleAccordionAction {
    type:typeof ActionTypes.toggleAccordion;
    payload:ItoggleAccordionPayload;
}

export type Iactions = IeditTextFieldAction 
    | IeditStringArrayAction
    | IeditDateAction
    | ItoggleAccordionAction
    | IeditFilesAction
    | IdeleteFileAction
    | IupsertObjAction

const 
    reducer = (state:TaskEdit,{type,payload}:Iactions) => {
        switch (type){
            case ActionTypes.editTextField:
            case ActionTypes.editDate:
            case ActionTypes.toggleAccordion:
            case ActionTypes.editStringArray:
            case ActionTypes.editFiles:
                return {
                    ...state,
                    [payload.key]:payload.value
                }
            case ActionTypes.deleteFile:
                return {
                    ...state,
                    files:state.files.filter(f=>f.id!==payload)
                }
            case ActionTypes.upsertObj:
                return {...state,...payload}
        }
    },
    editTextFieldAction = (payload:IeditTextFieldPayload) => ({
        type:ActionTypes.editTextField,
        payload
    }),
    editDateAction = (payload:IeditDatePayload) => ({
        type:ActionTypes.editDate,
        payload
    }),
    editStringArrayAction = (payload:IeditStringArrayPayload) => ({
        type:ActionTypes.editStringArray,
        payload
    }),
    editFilesAction = (payload:IeditFilesPayload) => ({
        type:ActionTypes.editFiles,
        payload
    }),
    toggleAccordionAction = (payload:ItoggleAccordionPayload) => ({
        type:ActionTypes.toggleAccordion,
        payload
    }),
    deleteFileAction = (payload:EntityId) => ({
        type:ActionTypes.deleteFile,
        payload
    }),
    upsertObjAction = (payload:{[k:string]:any}) => ({
        type:ActionTypes.upsertObj,
        payload
    })

export { 
    reducer,
    editTextFieldAction,
    editStringArrayAction,
    editDateAction,
    toggleAccordionAction,
    editFilesAction,
    deleteFileAction,
    upsertObjAction,
}