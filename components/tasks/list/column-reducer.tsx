import { EntityId } from "@reduxjs/toolkit"

export interface IcolumnFields {
    fields:EntityId[];
    columnMove:EntityId;
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
    initialState:IcolumnFields = {
        fields:[],
        columnMove:''
    },
    reducer = (state:IcolumnFields,{type,payload}:Iaction) => {
        switch (type) {
            case ActionTypes.start:
                return {
                    ...state,
                    columnMove:payload
                }
            case ActionTypes.moving:
                const newFields = state.fields.filter(f=>f !== state.columnMove)
                if (payload===0) return {...state,fields:[state.columnMove,...newFields]}
                else if (payload===state.fields.length - 1) return {...state,fields:[...newFields,state.columnMove]}
                else return {...state,fields:[...newFields.slice(0,payload),state.columnMove,...newFields.slice(payload)]}
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