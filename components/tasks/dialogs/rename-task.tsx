import React, { FormEvent, memo, useContext, useEffect, useRef } from "react";
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { DialogCtxMenuDispatchContext } from '../contexts';
import { toggleDialogAction } from "../reducers/dialog-ctxmenu-status";
import { useTaskUpdateOneFieldMutation } from "../reducers/api";
import { useRouter } from "next/router";

const RenameTaskDialog = memo(({open}:{open:boolean})=>{
    const
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'renameTask',open:false})),
        textRef = useRef<HTMLInputElement>(),
        submitRef = useRef<HTMLInputElement>(),
        submitOnClick = () => submitRef.current.click(),
        router = useRouter(),
        taskID = router.query.taskid as string,
        [taskUpdateOneField] = useTaskUpdateOneFieldMutation(),
        onSubmit = (e:FormEvent) => {
            e.preventDefault()
            onClose()
            taskUpdateOneField({
                id:taskID,
                field:'name',
                value:textRef.current.value
            })
        }

    useEffect(()=>{
        if (open){
            textRef.current.value = ''
            textRef.current.focus()
        }
    },[open])

    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Rename Task</DialogTitle>
            <DialogContent>
                <Box component='form' sx={{mt:1}} onSubmit={onSubmit}>
                    <TextField 
                        fullWidth
                        required
                        inputRef={textRef}
                        label='New Task Name'
                    />
                    <input hidden type='submit' ref={submitRef} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant='contained' onClick={submitOnClick}>Submit</Button>
            </DialogActions>
        </Dialog>
    )
})
RenameTaskDialog.displayName = 'RenameTaskDialog'
export default RenameTaskDialog