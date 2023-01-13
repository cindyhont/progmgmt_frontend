import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { ChangeEvent, memo, useMemo, useRef, useState } from "react";
import { taskEditSingleField, taskSelector } from "../reducers/slice";
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import taskApi, { useTaskUpdateParentsMutation } from "../reducers/api";
import { grey } from '@mui/material/colors';

export interface Ioption {
    value:EntityId;
    label:string;
}

const 
    Parent = (
        {
            id,
            editMode
        }:{
            id:EntityId;
            editMode:boolean;
        }
    ) => {
        const 
            parentNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,id)
                    if (!task || task.parents.length < 2) return ''
                    const parentTask = taskSelector.selectById(state,task.parents[task.parents.length - 2])
                    return parentTask?.name || ''
                }
            ),[id]),
            parentName = useAppSelector(state => parentNameSelector(state))

        return (
            <TableCell 
                className={`$parents task-list-body-cell`}
                data-field='parents'
                data-taskid={id}
                sx={{
                    ...(editMode && {p:0})
                }}
            >
                {!editMode && <Typography sx={{fontSize:'0.9rem',...(!parentName && {color:grey[500]})}}>{parentName || '(No Parent)'}</Typography>}
                {editMode && <Editor {...{id}} />}
            </TableCell>
        )
    },
    Editor = memo(({id}:{id:EntityId;}) => {
        const
            dispatch = useAppDispatch(),
            noParent = useRef({
                value:'',
                label:'(No parent)',
            }).current,
            initValueSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,id)
                    if (!task || !task.parents || task.parents.length < 2) return noParent
                    const 
                        parentTaskID = task.parents[task.parents.length - 2],
                        parentTask = taskSelector.selectById(state,parentTaskID)
                    return {
                        value:parentTaskID,
                        label:parentTask.name,
                        // parents:parentTask.parents
                    }
                }
            ),[id]),
            initValue = useAppSelector(state => initValueSelector(state)),
            [options,setOptions] = useState<Ioption[]>(initValue.value==='' ? [noParent] : [initValue,noParent]),
            [updateParents] = useTaskUpdateParentsMutation(),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:Ioption|null
            ) => {
                e.preventDefault()
                updateParents({taskID:id,parent:!!v ? v.value : ''})
                dispatch(taskEditSingleField(false))
            },
            loaded = useRef(false),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (['',noParent.label].includes(v.trim())) {
                    setOptions([noParent])
                    return
                }
                try {
                    const response = await dispatch(taskApi.endpoints.searchTasks.initiate({query:v,exclude:[id]})).unwrap()
                    setOptions([...response,noParent])
                } catch (error) {
                    setOptions([noParent])
                }
                
            },
            onBlur = () => {
                if (loaded.current) dispatch(taskEditSingleField(false))
                else loaded.current = true
            }

        return (
            <Autocomplete 
                disablePortal
                fullWidth
                defaultValue={initValue}
                options={options}
                onChange={onChange}
                onInputChange={onInputChange}
                isOptionEqualToValue={(opt,val)=>opt.value===val.value}
                filterSelectedOptions={false}
                disableClearable
                onBlur={onBlur}
                forcePopupIcon={false}
                filterOptions={x => x}
                renderInput={(params) => <TextField {...params} autoFocus size='small' sx={{ml:1}} />}
                sx={{
                    '.MuiFormControl-root':{
                        m:0
                    }
                }}
            />
        )
    })

Editor.displayName = 'Editor'
export default Parent