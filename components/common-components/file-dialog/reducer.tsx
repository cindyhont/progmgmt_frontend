import { FileDraft } from "@components/interfaces"
import { EntityId } from "@reduxjs/toolkit";

const ActionTypes = {
    add:'add' as 'add',
    delete:'delete' as 'delete',
    set:'set' as 'set'
}

export interface Ifiles {
    files:FileDraft[];
}

export interface IaddAction {
    type: typeof ActionTypes.add;
    payload:FileDraft[];
}

export interface IdeleteAction {
    type: typeof ActionTypes.delete;
    payload:EntityId;
}

export interface IsetAllAction {
    type: typeof ActionTypes.set;
    payload: FileDraft[];
}

export type Iaction = IaddAction | IdeleteAction | IsetAllAction

const 
    initialState:Ifiles = {
        files:[]
    },
    reducer = (state:Ifiles,{type,payload}:Iaction) => {
        switch (type){
            case ActionTypes.add:
                return {...state,files:[...state.files,...payload]}
            case ActionTypes.delete:
                return {...state,files:state.files.filter(e=>e.id!==payload)}
            case ActionTypes.set:
                return {...state,files:[...payload]}
        }
    },
    addAction = (payload:FileDraft[]) => ({
        type:ActionTypes.add,
        payload
    }),
    deleteAction = (payload:EntityId) => ({
        type:ActionTypes.delete,
        payload
    }),
    setAllAction = (payload:FileDraft[]) => ({
        type:ActionTypes.set,
        payload
    })

export {
    initialState,
    reducer,
    addAction,
    deleteAction,
    setAllAction,
}