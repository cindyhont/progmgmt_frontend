import { createContext, Dispatch } from "react";
import { Iaction, Istatus } from "./reducers/dialog-ctxmenu-status";

const 
    DialogCtxMenuDispatchContext = createContext<{dialogCtxMenuStatusDispatch:Dispatch<Iaction>}>({dialogCtxMenuStatusDispatch:()=>{}}),
    DialogCtxMenuStateContext = createContext<Istatus>({
        contextMenuPosition:{top:0,left:0},
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
    })

export {
    DialogCtxMenuDispatchContext,
    DialogCtxMenuStateContext
}