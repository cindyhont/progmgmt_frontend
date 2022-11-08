import React, { memo, useContext, useEffect, useMemo, useRef } from "react";
import { DialogCtxMenuDispatchContext } from "../contexts";
import { toggleDialogAction } from "../reducers/dialog-ctxmenu-status";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import DialogContentText from '@mui/material/DialogContentText';
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import Button from "@mui/material/Button";
import { useStore } from "react-redux";
import IndexedDB from "@indexeddb";
import { useTaskDeleteCustomFieldMutation } from "../reducers/api";
import { taskFieldSelector } from "../reducers/slice";
import { updateTaskFieldLayoutInRedux } from "@indexeddb/functions";

const DeleteFieldDialog = memo(({open}:{open:boolean})=>{
    const 
        idb = useRef<IndexedDB>(),
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteField',open:false})),
        fieldNameSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
            (state:ReduxState)=>state,
            (fieldID:EntityId,state:ReduxState)=>taskFieldSelector.selectById(state,fieldID)?.fieldName || ''
        ),[]),
        fieldName = useAppSelector(state => fieldNameSelector(state)),
        store = useStore(),
        [deleteCustomField] = useTaskDeleteCustomFieldMutation(),
        onClick = () => {
            onClose()

            const 
                state = store.getState() as ReduxState,
                fields = taskFieldSelector.selectAll(state),
                deleteFieldID = state.taskMgmt.ctxMenuFieldID,
                filteredFields = fields.filter(e=>e.id!==deleteFieldID),
                updates = updateTaskFieldLayoutInRedux(fields,filteredFields)

            deleteCustomField({fieldID:deleteFieldID,updates})
            idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates,deleteFieldID)
        }

    useEffect(()=>{
        const state = store.getState() as ReduxState
        idb.current = new IndexedDB(state.misc.uid.toString(),1)
    },[])

    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Delete <span style={{fontStyle:'italic'}}>{fieldName}</span></DialogTitle>
            <DialogContent>
                <DialogContentText>All the data in this field cannot be recovered.</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" color='error' onClick={onClick}>Delete</Button>
            </DialogActions>
        </Dialog>
    )
})
DeleteFieldDialog.displayName = 'DeleteFieldDialog'
export default DeleteFieldDialog