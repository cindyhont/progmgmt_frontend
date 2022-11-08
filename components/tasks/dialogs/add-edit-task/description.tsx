import React, { memo, useCallback, useContext, useState } from "react";
import { editFilesAction, editTextFieldAction } from "./reducer";
import { Context } from ".";
import { WYSIWYGcommon } from "@components/common-components";
import { FileDraft } from "@components/interfaces";
import FileDialog from "@components/common-components/file-dialog";

const
    Description = memo((
        {
            value,
            field,
            label,
            files,
        }:{
            value:string;
            field:'description';
            label:string
            files:FileDraft[];
        }
    ) => {
        const 
            {addEditTaskDispatch} = useContext(Context),
            handleUpdate = useCallback((e:string) => addEditTaskDispatch(editTextFieldAction({key:field,value:e})),[]),
            updateFiles = useCallback((e:FileDraft[])=>addEditTaskDispatch(editFilesAction({key:'files',value:[...e]})),[]),
            [fileDialogOpen,setFileDialogOpen] = useState(false),
            updateDialogStatus = useCallback((e:boolean)=>setFileDialogOpen(e),[])

        return (
            <>
            <WYSIWYGcommon {...{
                value,
                handleUpdate,
                placeholder:`${label} ...`,
                height:'300px',
                showFileIconMark:files.length !== 0,
                fileBtnOnClick:()=>updateDialogStatus(true)
            }} />
            <FileDialog {...{
                open:fileDialogOpen,
                onClose:()=>updateDialogStatus(false),
                files,
                updateFiles,
            }} />
            </>
        )
    })
Description.displayName = 'Description'
export default Description