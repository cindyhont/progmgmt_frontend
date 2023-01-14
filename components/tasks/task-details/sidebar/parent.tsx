import { taskSelector } from "@components/tasks/reducers/slice";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector } from "@reduxjs/toolkit";
import { useRouter } from "next/router";
import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createEditRightSelector } from ".";
import TextDisplayWrapper from "./text-display-wrapper";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import SimpleTextDisplay from "./simple-text-display";
import EditModeToggle from "./edit-mode-toggle-button";
import TextFieldSubmitButton from "./text-field-submit-button";
import { useSearchTasksMutation, useTaskUpdateParentsMutation } from "@components/tasks/reducers/api";
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

export interface Ioption {
    value:string;
    label:string;
}

const 
    Parent = memo(()=>{
        const 
            taskID = useRouter().query.taskid as string, 
            editRightSelector = useMemo(()=>createEditRightSelector('parents',taskID),[taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            parentNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,taskID)
                    if (!task || !task.parents || task.parents.length < 2) return ''
                    const parentID = task.parents[task.parents.length - 2]
                    const parentTask = taskSelector.selectById(state,parentID)
                    return parentTask?.name || ''
                }
            ),[taskID]),
            parentName = useAppSelector(state => parentNameSelector(state)),
            [editMode,setEditMode] = useState(false),
            editOnClick = useCallback(() => setEditMode(true),[]),
            editModeOff = useCallback(() => setEditMode(false),[])

        useEffect(()=>{
            if (!hasEditRight) setEditMode(false)
        },[hasEditRight])

        return (
            <TextDisplayWrapper {...{editMode}}>
                <>
                {!editMode && <TableRow>
                    <SimpleTextDisplay {...{
                        nilTextColor:!parentName,
                        content:parentName || '(No parent)'
                    }} />
                    {hasEditRight && <EditModeToggle {...{onClick:editOnClick}} />}
                </TableRow>}
                {editMode && <Editor {...{editModeOff}} />}
                </>
            </TextDisplayWrapper>
        )
    }),
    Editor = memo((
        {
            editModeOff,
        }:{
            editModeOff:()=>void;
        }
    )=>{
        const
            taskID = useRouter().query.taskid as string,
            noParent = useRef({
                value:'',
                label:'(No parent)',
            }).current,
            initValueSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,taskID)
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
            ),[taskID]),
            initValue = useAppSelector(state => initValueSelector(state)),
            [value,setValue] = useState(initValue),
            [options,setOptions] = useState([noParent]),
            [updateParents] = useTaskUpdateParentsMutation(),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:Ioption|null
            ) => {
                e.preventDefault()
                setValue(v)
            },
            [searchTasks] = useSearchTasksMutation(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                if (['',noParent.label].includes(v.trim())) {
                    setOptions([noParent])
                    return
                }
                try {
                    const response = await searchTasks({query:v,exclude:[taskID]}).unwrap()
                    setOptions([...response,noParent])
                } catch (error) {
                    setOptions([noParent])
                }
            },
            onSubmit = () => {
                updateParents({taskID,parent:value.value})
                editModeOff()
            }

        return (
            <TableRow>
                <TableCell>
                    <Autocomplete 
                        disablePortal
                        fullWidth
                        value={value}
                        options={options}
                        onChange={onChange}
                        onInputChange={onInputChange}
                        isOptionEqualToValue={(opt,val)=>opt.value===val.value}
                        filterSelectedOptions={false}
                        disableClearable
                        forcePopupIcon={false}
                        filterOptions={x => x}
                        renderInput={(params) => <TextField {...params} fullWidth size='small' sx={{ml:1}} />}
                    />
                </TableCell>
                <TableCell sx={{width:0}}>
                    <TextFieldSubmitButton {...{onSubmit}} />
                </TableCell>
            </TableRow>
        )
    })
Parent.displayName = 'Parent'
Editor.displayName = 'Editor'
export default Parent