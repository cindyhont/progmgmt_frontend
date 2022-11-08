import { EntityId } from "@reduxjs/toolkit";
// import { Dayjs } from 'dayjs';

const ActionTypes = {
    name:'name' as 'name',
    fieldType:'fieldType' as 'fieldType',
    defaultValues:'defaultValues' as 'defaultValues',
    options:'options' as 'options',
    reset:'reset' as 'reset',
}

export interface IcustomField {
    name:string;
    fieldType:EntityId;
    defaultValues:{
        [k:string]:any;
    };
    options:{
        [k:string]:any[];
    }
}

export interface InameAction {
    type:typeof ActionTypes.name;
    payload:string;
}

export interface ItypeIdAction {
    type:typeof ActionTypes.fieldType;
    payload:EntityId;
}

export interface IdefaultValueAction {
    type:typeof ActionTypes.defaultValues;
    payload:{
        key:EntityId;
        value:any;
    }
}

export interface IoptionAction {
    type:typeof ActionTypes.options;
    payload:{
        key:EntityId;
        value:any;
    }
}

export interface IresetAction {
    type: typeof ActionTypes.reset;
    payload:IcustomField;
}

export type Iaction = InameAction | ItypeIdAction | IdefaultValueAction | IoptionAction | IresetAction

const 
    initialState:IcustomField = {
        name:'',
        fieldType:'',
        defaultValues:{},
        options:{}
    },
    reducer = (state:IcustomField,{type,payload}:Iaction) => {
        switch (type) {
            case ActionTypes.name:
            case ActionTypes.fieldType:
                return {
                    ...state,
                    [type]:payload
                }
            case ActionTypes.defaultValues:
                return {
                    ...state,
                    defaultValues:{
                        ...state.defaultValues,
                        [payload.key]:payload.value
                    }
                }
            case ActionTypes.options:
                return {
                    ...state,
                    options:{
                        ...state.options,
                        [payload.key]:payload.value
                    }
                }
            case ActionTypes.reset:
                return {...state,...payload}
        }
    },
    editNameAction = (payload:string) => ({
        type:ActionTypes.name,
        payload
    }),
    editTypeIdAction = (payload:EntityId) => ({
        type:ActionTypes.fieldType,
        payload
    }),
    editDefaultValueAction = (payload:{key:EntityId;value:any})=>({
        type:ActionTypes.defaultValues,
        payload
    }),
    editOptionsAction = (payload:{key:EntityId;value:any[]}) => ({
        type:ActionTypes.options,
        payload
    }),
    resetAction = (payload:IcustomField) => ({
        type:ActionTypes.reset,
        payload
    })

export {
    initialState,
    reducer,
    editNameAction,
    editTypeIdAction,
    editDefaultValueAction,
    editOptionsAction,
    resetAction,
}