import { EntityId } from "@reduxjs/toolkit"

const ActionTypes = {
    add:'add' as 'add',
    delete:'delete' as 'delete',
    set:'set' as 'set'
}

export interface IlistFields {
    fields:EntityId[];
}

export interface IaddAction {
    type: typeof ActionTypes.add;
    payload: EntityId;
}

export interface IdeleteAction {
    type: typeof ActionTypes.delete;
    payload: EntityId;
}

export interface IsetAction {
    type: typeof ActionTypes.set;
    payload: EntityId[];
}

export type Iaction = IaddAction | IdeleteAction | IsetAction;

const 
    reducer = (state:IlistFields,{type,payload}:Iaction) => {
        switch (type){
            case ActionTypes.add:
                return {...state,fields:[...state.fields,payload]}
            case ActionTypes.delete:
                return {...state,fields:state.fields.filter(e=>e!==payload)}
            case ActionTypes.set:
                return {...state,fields:[...payload]}
        }
    },
    addAction = (payload:EntityId) => ({
        type: ActionTypes.add,
        payload
    }),
    deleteAction = (payload:EntityId) => ({
        type: ActionTypes.delete,
        payload
    }),
    setAllAction = (payload:EntityId[]) => ({
        type: ActionTypes.set,
        payload
    })

export {
    reducer,
    addAction,
    deleteAction,
    setAllAction,
}