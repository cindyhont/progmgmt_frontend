import { EntityId } from "@reduxjs/toolkit"

const ActionTypes = {
    add:'add' as 'add',
    delete:'delete' as 'delete',
    set:'set' as 'set',
}

export interface Ipeople {
    list:EntityId[];
}

export interface IaddAction {
    type:typeof ActionTypes.add;
    payload:EntityId;
}

export interface IdeleteAction {
    type:typeof ActionTypes.delete;
    payload:EntityId;
}

export interface IsetAllAction {
    type: typeof ActionTypes.set;
    payload:EntityId[];
}

export type Iaction = IaddAction | IdeleteAction | IsetAllAction

const 
    reducer = (state:Ipeople,{type,payload}:Iaction) => {
        switch (type) {
            case ActionTypes.add:
                return {...state,list:[...state.list,payload]}
            case ActionTypes.delete:
                return {...state,list:state.list.filter(e=>e!==payload)}
            case ActionTypes.set:
                return {...state,list:[...payload]}
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