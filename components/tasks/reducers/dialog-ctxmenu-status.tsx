const 
    items = {
        contextMenuPosition:'contextMenuPosition' as 'contextMenuPosition',
        contextMenu:'contextMenu' as 'contextMenu',
        addTask:'addTask' as 'addTask',
        addTaskDefaultObj:'addTaskDefaultObj' as 'addTaskDefaultObj',
        addBoardColumn:'addBoardColumn' as 'addBoardColumn',
        editTask:'editTask' as 'editTask',
        addCustomField:'addCustomField' as 'addCustomField',
        editCustomField:'editCustomField' as 'editCustomField',
        editListViewColumns:'editListViewColumns' as 'editListViewColumns',
        renameBoardColumn:'renameBoardColumn' as 'renameBoardColumn',
        deleteBoardColumn:'deleteBoardColumn' as 'deleteBoardColumn',
        renameTask:'renameTask' as 'renameTask',
        deleteTask:'deleteTask' as 'deleteTask',
        deleteField:'deleteField' as 'deleteField',
        visitorNoticeParentSearch:'visitorNoticeParentSearch' as 'visitorNoticeParentSearch',
    },
    ActionTypes = {
        toggleDialog:'toggleDialog' as 'toggleDialog',
        addTask:'addTask' as 'addTask',
        openContextMenu:'openContextMenu' as 'openContextMenu',
        closeContextMenu:'closeContextMenu' as 'closeContextMenu',
    }

export interface Istatus {
    contextMenuPosition:{top:number;left:number};
    contextMenu:boolean;
    addTask:boolean;
    addTaskDefaultObj:{
        [k:string]:any;
    };
    addBoardColumn:boolean;
    editTask:boolean;
    addCustomField:boolean;
    editCustomField:boolean;
    editListViewColumns:boolean;
    renameBoardColumn:boolean;
    deleteBoardColumn:boolean;
    renameTask:boolean;
    deleteTask:boolean;
    deleteField:boolean;
    visitorNoticeParentSearch:boolean;
}

export interface ItoggleDialogPayload {
    dialog:typeof items.addTask
        | typeof items.addCustomField
        | typeof items.editCustomField
        | typeof items.addBoardColumn
        | typeof items.editListViewColumns
        | typeof items.editTask
        | typeof items.contextMenu
        | typeof items.renameBoardColumn
        | typeof items.deleteBoardColumn
        | typeof items.renameTask
        | typeof items.deleteTask
        | typeof items.deleteField
        | typeof items.visitorNoticeParentSearch
    open:boolean;
}

export interface ItoggleDialogAction {
    type:typeof ActionTypes.toggleDialog;
    payload:ItoggleDialogPayload;
}

export interface IopenContextMenuAction {
    type:typeof ActionTypes.openContextMenu;
    payload:{top:number;left:number};
}

export interface IaddTaskAction {
    type: typeof ActionTypes.addTask;
    payload:{
        [k:string]:any;
    }
}

export type Iaction = ItoggleDialogAction
    | IaddTaskAction
    | IopenContextMenuAction

const 
    initialState:Istatus = {
        contextMenuPosition:{
            left:0,
            top:0,
        },
        contextMenu:false,
        addTask:false,
        addTaskDefaultObj:{},
        addBoardColumn:false,
        editTask:false,
        addCustomField:false,
        editCustomField:false,
        editListViewColumns:false,
        renameBoardColumn:false,
        deleteBoardColumn:false,
        renameTask:false,
        deleteTask:false,
        deleteField:false,
        visitorNoticeParentSearch:false,
    },
    reducer = (state:Istatus,{type,payload}:Iaction)=> {
        switch (type){
            case ActionTypes.toggleDialog:
                return {...state,[payload.dialog]:payload.open}
            case ActionTypes.addTask:
                return {
                    ...state,
                    addTaskDefaultObj:payload,
                    addTask:true
                }
            case ActionTypes.openContextMenu:
                return {
                    ...state,
                    contextMenuPosition:payload,
                    contextMenu:true,
                }
        }
    },
    toggleDialogAction = (payload:ItoggleDialogPayload) => ({
        type:ActionTypes.toggleDialog,
        payload
    }),
    addTaskAction = (payload:{[k:string]:any}) => ({
        type:ActionTypes.addTask,
        payload
    }),
    openCtxMenuAction = (payload:{left:number;top:number;}) => ({
        type:ActionTypes.openContextMenu,
        payload
    })


export {
    initialState,
    reducer,
    toggleDialogAction,
    addTaskAction,
    openCtxMenuAction,
}