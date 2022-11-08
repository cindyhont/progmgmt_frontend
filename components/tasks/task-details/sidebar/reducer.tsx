import { EntityId } from "@reduxjs/toolkit"

export interface ItaskDetailsSidebarModules {
    fields:EntityId[];
    moduleMove:EntityId;
}

const ActionTypes = {
    start:'start' as 'start',
    moving:'moving' as 'moving',
    set:'set' as 'set'
}

export interface IstartAction {
    type: typeof ActionTypes.start;
    payload: EntityId;
}

export interface ImovingAction {
    type: typeof ActionTypes.moving;
    payload: number;
}

export interface IsetAction {
    type: typeof ActionTypes.set;
    payload: EntityId[];
}

export type Iaction = IstartAction | ImovingAction | IsetAction;

const
    initialState:ItaskDetailsSidebarModules = {
        fields:[],
        moduleMove:''
    },
    reducer = (state:ItaskDetailsSidebarModules,{type,payload}:Iaction) => {
        switch (type) {
            case ActionTypes.start:
                return {
                    ...state,
                    moduleMove:payload
                }
            case ActionTypes.moving:
                const newFields = state.fields.filter(f=>f !== state.moduleMove)
                if (payload===0) return {...state,fields:[state.moduleMove,...newFields]}
                else if (payload===state.fields.length - 1) return {...state,fields:[...newFields,state.moduleMove]}
                else return {...state,fields:[...newFields.slice(0,payload),state.moduleMove,...newFields.slice(payload)]}
            case ActionTypes.set:
                return {...state,fields:[...payload]}
        }
    },
    startMovingAction = (payload:EntityId) => ({
        type:ActionTypes.start,
        payload
    }),
    movingAction = (payload:number) => ({
        type:ActionTypes.moving,
        payload
    }),
    setAllAction = (payload:EntityId[]) => ({
        type:ActionTypes.set,
        payload
    })

export {
    reducer,
    initialState,
    startMovingAction,
    movingAction,
    setAllAction,
}