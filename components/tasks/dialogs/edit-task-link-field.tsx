import React, { ChangeEvent, memo, useEffect, useMemo, useState } from 'react'
import TextField from "@mui/material/TextField";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { taskEditSingleField, taskFieldSelector, taskSelector } from '../reducers/slice';
import { useStore } from 'react-redux';
import taskApi from '../reducers/api';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

const
    EditTaskLinkDialog = memo(()=>{
        const 
            editModeSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state.taskMgmt.editField,
                (state:ReduxState)=>state,
                (taskID:EntityId,field:EntityId,editField:boolean,state:ReduxState)=>{
                    if (!taskID || !field || !editField) return false

                    const fieldObj = taskFieldSelector.selectById(state,field)
                    return !!fieldObj && fieldObj.fieldType==='link'
                }
            ),[]),
            editOn = useAppSelector(state => editModeSelector(state)),
            [textValue,setTextValue] = useState(''),
            [urlValue,setUrlValue] = useState(''),
            textOnChange = (e:ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value),
            urlOnChange = (e:ChangeEvent<HTMLInputElement>) => setUrlValue(e.target.value),
            dispatch = useAppDispatch(),
            store = useStore(),
            onClose = () => dispatch(taskEditSingleField(false)),
            submitOnClick = () => {
                onClose()
                const state = store.getState() as ReduxState
                dispatch(
                    taskApi.endpoints.taskUpdateOneField.initiate({
                        id:state.taskMgmt.ctxMenuTaskID,
                        field:state.taskMgmt.ctxMenuFieldID,
                        value:{text:textValue,url:urlValue}
                    }
                ))
            }

        useEffect(()=>{
            if (editOn){
                const 
                    state = store.getState() as ReduxState,
                    task = taskSelector.selectById(state,state.taskMgmt.ctxMenuTaskID),
                    field = task[state.taskMgmt.ctxMenuFieldID]

                setTextValue(field?.text || '')
                setUrlValue(field?.url || '')
            }
        },[editOn])

        return (
            <Dialog open={editOn} onClose={onClose} keepMounted>
                <DialogTitle>Edit Link</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} mt={1}>
                        <TextField 
                            fullWidth
                            label='Text'
                            value={textValue}
                            onChange={textOnChange}
                        />
                        <TextField 
                            fullWidth
                            label='URL'
                            value={urlValue}
                            onChange={urlOnChange}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={submitOnClick} variant='contained'>Submit</Button>
                </DialogActions>
            </Dialog>
        )
    })
EditTaskLinkDialog.displayName = 'EditTaskLinkDialog'
export default EditTaskLinkDialog