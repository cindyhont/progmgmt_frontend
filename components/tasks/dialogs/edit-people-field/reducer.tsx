import { EntityId } from "@reduxjs/toolkit";

const ActionTypes = {
    add:'add' as 'add',
    delete:'delete' as 'delete',
    set:'set' as 'set'
}

export interface IpeopleDialog {
    ids:EntityId[];
}

export interface IaddAction {
    type: typeof ActionTypes.add;
    payload:EntityId;
}

export interface IdeleteAction {
    type: typeof ActionTypes.delete;
    payload:EntityId;
}

export interface IsetAction {
    type: typeof ActionTypes.set;
    payload:EntityId[];
}

export type Iaction = IaddAction | IdeleteAction | IsetAction;

const 
    reducer = (state:IpeopleDialog,{type,payload}:Iaction) => {
        switch (type){
            case ActionTypes.add:
                return {...state,ids:[...state.ids,payload]}
            case ActionTypes.delete:
                return {...state,ids:state.ids.filter(i=>i!==payload)}
            case ActionTypes.set:
                return {...state,ids:[...payload]}
        }
    },
    addAction = (payload:EntityId) => ({
        type:ActionTypes.add,
        payload
    }),
    deleteAction = (payload:EntityId) => ({
        type:ActionTypes.delete,
        payload
    }),
    setAllAction = (payload:EntityId[]) => ({
        type:ActionTypes.set,
        payload
    })

export {
    reducer,
    addAction,
    deleteAction,
    setAllAction
}