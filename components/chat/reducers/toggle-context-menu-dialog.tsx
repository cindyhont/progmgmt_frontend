export interface Istatus {
    contextMenuPosition:{
        left:number;
        top:number;
    };
    openRoomContextMenu:boolean;
    openConvoOthersContextMenu:boolean;
    openConvoSelfContextMenu:boolean;
    openNewGroupDialog:boolean;
    openForwardDialog:boolean;
}

const ActionTypes = {
    open:'open' as 'open',
    close:'close' as 'close',
    dialog:'dialog' as 'dialog',
}

export interface IopenMenuAction{
    type: typeof ActionTypes.open;
    payload:{
        left:number;
        top:number;
        key:'openRoomContextMenu'|'openConvoOthersContextMenu'|'openConvoSelfContextMenu';
    }
}

export interface IcloseMenuAction{
    type: typeof ActionTypes.close;
    payload:'openRoomContextMenu'|'openConvoOthersContextMenu'|'openConvoSelfContextMenu';
}

export interface ItoggleDialogAction{
    type: typeof ActionTypes.dialog;
    payload:{
        key:'openNewGroupDialog'|'openForwardDialog'
        open:boolean;
    }
}

export type Iactions = IopenMenuAction | IcloseMenuAction | ItoggleDialogAction

const
    initialState:Istatus = {
        contextMenuPosition:{
            left:0,
            top:0,
        },
        openRoomContextMenu:false,
        openConvoOthersContextMenu:false,
        openConvoSelfContextMenu:false,
        openNewGroupDialog:false,
        openForwardDialog:false,
    },
    reducer = (state:Istatus,{type,payload}:Iactions) => {
        switch(type){
            case ActionTypes.open:
                return {
                    ...state,
                    contextMenuPosition:{
                        left:payload.left,
                        top:payload.top
                    },
                    [payload.key]:true
                }
            case ActionTypes.close:
                return {...state,[payload]:false}
            case ActionTypes.dialog:
                return {
                    ...state,
                    [payload.key]:payload.open
                }
        }
    },
    openContextMenuAction = (payload:{
        left:number;
        top:number;
        key:'openRoomContextMenu'|'openConvoOthersContextMenu'|'openConvoSelfContextMenu';
    })=>({
        type:ActionTypes.open,
        payload
    }),
    closeContextMenuAction = (payload:'openRoomContextMenu'|'openConvoOthersContextMenu'|'openConvoSelfContextMenu') => ({
        type:ActionTypes.close,
        payload
    }),
    toggleDialogAction = (payload:{
        key:'openNewGroupDialog'|'openForwardDialog'
        open:boolean;
    })=>({
        type:ActionTypes.dialog,
        payload
    })

export {
    initialState,
    reducer,
    openContextMenuAction,
    closeContextMenuAction,
    toggleDialogAction
}