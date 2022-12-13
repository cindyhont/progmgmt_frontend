import React, { memo, SyntheticEvent, useEffect, useMemo, useState } from 'react'
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
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';

export interface Ioption {
    id:EntityId;
    name:string;
    color:string;
}

const 
    EditTaskTagsField = memo(()=>{
        const
            optionsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state,
                (field:EntityId,state:ReduxState)=>{
                    if (!field) return []
                    const fieldObj = taskFieldSelector.selectById(state,field)
                    if (!fieldObj) return []
                    return fieldObj?.details?.options as Ioption[] || []
                }
            ),[]),
            options = useAppSelector(state => optionsSelector(state)),
            editModeSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state.taskMgmt.editField,
                (state:ReduxState)=>state,
                (taskID:EntityId,field:EntityId,editField:boolean,state:ReduxState)=>{
                    if (!taskID || !field || !editField) return false
                    const fieldObj = taskFieldSelector.selectById(state,field)
                    return !!fieldObj && fieldObj.fieldType==='tags'
                }
            ),[]),
            editOn = useAppSelector(state => editModeSelector(state)),
            theme = useTheme(),
            store = useStore(),
            [value,setValue] = useState<Ioption[]>([]),
            updateValue = () => {
                const
                    state = store.getState() as ReduxState,
                    field = state.taskMgmt.ctxMenuFieldID,
                    v = taskSelector.selectById(state,state.taskMgmt.ctxMenuTaskID)[field] as EntityId[]
                if (v.length===0) setValue([])
                const opts = taskFieldSelector.selectById(state,field).details.options as Ioption[]
                setValue([...v.map(i=>opts.find(e=>e.id===i))])
            },
            onChange = (_:SyntheticEvent,v:Ioption[]) => setValue([...v]),
            dispatch = useAppDispatch(),
            onClose = () => dispatch(taskEditSingleField(false)),
            submitOnClick = () => {
                const state = store.getState() as ReduxState
                dispatch(
                    taskApi.endpoints.taskUpdateOneField.initiate({
                        id:state.taskMgmt.ctxMenuTaskID,
                        field:state.taskMgmt.ctxMenuFieldID,
                        value:value.map(v=>v.id)
                    })
                )
                onClose()
            }

        useEffect(()=>{
            if (editOn) updateValue()
        },[editOn])

        return (
            <Dialog open={editOn} onClose={onClose}>
                <DialogTitle>Edit Tags</DialogTitle>
                <DialogContent>
                    <Autocomplete 
                        multiple
                        value={value}
                        onChange={onChange}
                        options={options}
                        renderInput={(params)=>(<TextField {...params} />)}
                        getOptionLabel={(opt:Ioption)=>opt.name}
                        renderTags={(tagValue, getTagProps) => tagValue.map(({name,color},index)=>(
                            <Chip 
                                label={name}
                                {...getTagProps({ index })}
                                sx={{
                                    backgroundColor:color,
                                    '.MuiChip-label':{
                                        color:theme.palette.getContrastText(color)
                                    }
                                }}
                                key={index}
                            />
                        ))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                    <Button onClick={submitOnClick} variant='contained'>Update</Button>
                </DialogActions>
            </Dialog>
        )
    })
EditTaskTagsField.displayName = 'EditTaskTagsField'
export default EditTaskTagsField