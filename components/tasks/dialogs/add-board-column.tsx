import React, { FormEvent, memo, useContext, useEffect, useRef } from 'react'
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import TextField from '@mui/material/TextField';
import { toggleDialogAction } from '../reducers/dialog-ctxmenu-status';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { ReduxState, useAppDispatch } from '@reducers';
import { useStore } from 'react-redux';
import { taskFieldSelector } from '../reducers/slice';
import taskApi from '../reducers/api';
import { v4 as uuidv4 } from 'uuid'
import { DialogCtxMenuDispatchContext } from '../contexts';

const AddBoardColumnDialog = memo(({open}:{open:boolean;}) => {
    const
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'addBoardColumn',open:false})),
        textFieldRef = useRef<HTMLInputElement>(),
        submitRef = useRef<HTMLInputElement>(),
        submitOnClick = () => submitRef.current.click(),
        dispatch = useAppDispatch(),
        store = useStore(),
        onSubmit = (e:FormEvent) => {
            e.preventDefault()
            onClose()

            const 
                state = store.getState() as ReduxState,
                boardColumnFieldObj = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column')

            dispatch(taskApi.endpoints.taskEditCustomField.initiate({
                id:boardColumnFieldObj.id,
                f:{
                    name:boardColumnFieldObj.fieldName,
                    fieldType:'board_column',
                    defaultValues:{['board_column']:boardColumnFieldObj.details.default},
                    options:{['board_column']:[...boardColumnFieldObj.details.options,{
                        id:uuidv4(),
                        name:textFieldRef.current.value,
                        order:boardColumnFieldObj.details.options.length
                    }]}
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
            <DialogTitle>Add Board Column</DialogTitle>
            <DialogContent>
                <Box
                    sx={{mt:1}}
                    component='form'
                    onSubmit={onSubmit}
                >
                    <TextField 
                        label='Column Title'
                        inputRef={textFieldRef}
                        required
                    />
                    <input hidden type='submit' ref={submitRef} />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={submitOnClick} variant='contained'>Add</Button>
            </DialogActions>
        </Dialog>
    )
})
AddBoardColumnDialog.displayName = 'AddBoardColumnDialog'
export default AddBoardColumnDialog