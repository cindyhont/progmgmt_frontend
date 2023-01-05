import { createContext, Dispatch } from "react";

const ActionTypes = {
    EDITOR_LOADED: 'editor_loaded' as 'editor_loaded',
}

export interface IchatContentEvents {
    editorLoaded:boolean;
}

export interface IeditorLoadComplete {
    type:typeof ActionTypes.EDITOR_LOADED;
    payload:boolean;
}

export type Iactions = IeditorLoadComplete

const 
    initialState:IchatContentEvents = {
        editorLoaded:false,
    },
    ChatEventDispatchContext = createContext<Dispatch<Iactions>>(()=>{}),
    ChatEventStateContext = createContext<IchatContentEvents>(initialState),
    reducer = (state:IchatContentEvents,{type,payload}:Iactions) => {
        switch (type){
            case ActionTypes.EDITOR_LOADED:
                return {...state,editorLoaded:payload}
        }
    },
    updateEditorLoadStatus = () => ({
        type:ActionTypes.EDITOR_LOADED,
        payload:true
    })

export {
    ChatEventDispatchContext,
    ChatEventStateContext,
    initialState,
    reducer,
    updateEditorLoadStatus,
}