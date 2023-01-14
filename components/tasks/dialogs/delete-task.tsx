import React, { memo, useContext } from "react";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import Button from "@mui/material/Button";
import { DialogCtxMenuDispatchContext } from '../contexts';
import { toggleDialogAction } from "../reducers/dialog-ctxmenu-status";
import { ReduxState } from "@reducers";
import { useDeleteTaskMutation } from "../reducers/api";
import { useRouter } from "next/router";
import { useStore } from "react-redux";

const DeleteTaskDialog = memo(({open}:{open:boolean})=>{
    const
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteTask',open:false})),
        router = useRouter(),
        taskID = router.query.taskid as string,
        store = useStore(),
        [deleteTask] = useDeleteTaskMutation(),
        deleteOnClick = () => {
            onClose()
            const 
                state = store.getState() as ReduxState,
                taskIDtoDelete = taskID || state.taskMgmt.ctxMenuTaskID
            if (!!taskIDtoDelete) deleteTask(taskIDtoDelete)
        }

    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogContent>
                <DialogContentText>Once deleted, the task cannot be recovered.</DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={deleteOnClick} variant='contained' color='error'>Delete</Button>
            </DialogActions>
        </Dialog>
    )
})
DeleteTaskDialog.displayName = 'DeleteTaskDialog'
export default DeleteTaskDialog