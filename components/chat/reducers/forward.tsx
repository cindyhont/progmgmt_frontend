import { EntityId } from "@reduxjs/toolkit";
import { Ioption } from "../interfaces";

const ActionTypes = {
    ADD: 'add' as 'add',
    DELETE: 'delete' as 'delete',
    RESET: 'reset' as 'reset',
    POP_ERROR: 'pop_error' as 'pop_error',
    CLOSE_ERROR: 'close_error' as 'close_error',
}

export interface IchatForward {
    rooms:Ioption[]
}

export interface IaddAction {
    type:typeof ActionTypes.ADD;
    payload:Ioption;
}

export interface IdeleteAction {
    type:typeof ActionTypes.DELETE;
    payload:EntityId;
}

export interface IresetAction {
    type:typeof ActionTypes.RESET;
    payload:undefined;
}

export type Iactions = IaddAction | IdeleteAction | IresetAction

const 
    initialState:IchatForward = {
        rooms:[],
    },
    reducer = (state:IchatForward,{type,payload}:Iactions) => {
        switch (type){
            case ActionTypes.ADD:
                return {...state,rooms:[...state.rooms,payload]}
            case ActionTypes.DELETE:
                return {...state,rooms:state.rooms.filter(r => r.id !== payload)}
            case ActionTypes.RESET:
                return {...state,rooms:[]}
        }
    },
    addNewRoom = (payload:Ioption) => ({
        type:ActionTypes.ADD,
        payload
    }),
    deleteRoom = (payload:EntityId) => ({
        type:ActionTypes.DELETE,
        payload
    }),
    resetForward = {
        type:ActionTypes.RESET,
        payload:undefined,
    }

export {
    initialState,
    reducer,
    addNewRoom,
    deleteRoom,
    resetForward,
}