import React, { FormEvent, memo, useContext, useEffect, useRef } from 'react'
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import TextField from "@mui/material/TextField";
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { toggleDialogAction } from '../reducers/dialog-ctxmenu-status';
import { useStore } from 'react-redux';
import { ReduxState, useAppDispatch } from '@reducers';
import { taskFieldSelector } from '../reducers/slice';
import taskApi from '../reducers/api';
import { DialogCtxMenuDispatchContext } from '../contexts';

const RenameBoardColumnDialog = memo(({open}:{open:boolean})=>{
    const
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'renameBoardColumn',open:false})),
        textFieldRef = useRef<HTMLInputElement>(),
        submitRef = useRef<HTMLInputElement>(),
        submitOnClick = () => submitRef.current.click(),
        store = useStore(),
        dispatch = useAppDispatch(),
        onSubmit = (e:FormEvent) => {
            e.preventDefault()
            onClose()

            const
                state = store.getState() as ReduxState,
                boardColumnID = state.taskMgmt.ctxMenuBoardColumnID,
                boardColumnType = 'board_column',
                boardColumnFieldObj = taskFieldSelector.selectAll(state).find(e=>e.fieldType===boardColumnType)

            dispatch(taskApi.endpoints.taskEditCustomField.initiate({
                id:boardColumnFieldObj.id,
                f:{
                    name:boardColumnFieldObj.fieldName,
                    fieldType:boardColumnType,
                    defaultValues:{[boardColumnType]:boardColumnFieldObj.details.default},
                    options:{[boardColumnType]:boardColumnFieldObj.details.options.map(e=>({...e,...(e.id===boardColumnID && {name:textFieldRef.current.value})}))}
                }
            }))
            
        }


    useEffect(()=>{
        if (open){
            textFieldRef.current.value = ''
            textFieldRef.current.focus()
        }
    },[open])

    return (
        <Dialog open={open} onClose={onClose} keepMounted>
            <DialogTitle>Rename Column</DialogTitle>
            <DialogContent>
                <Box onSubmit={onSubmit} component='form'>
                    <TextField 
                        required
                        fullWidth
                        inputRef={textFieldRef}
                        inputProps={{maxLength:30}}
                    />
                    <input hidden type='submit' ref={submitRef} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submitOnClick}>Submit</Button>
            </DialogActions>
        </Dialog>
    )
})
RenameBoardColumnDialog.displayName = 'RenameBoardColumnDialog'
export default RenameBoardColumnDialog