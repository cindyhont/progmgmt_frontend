import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { memo, useCallback, useMemo, useState } from "react";
import { Task, TaskField } from "../../interfaces";
import { taskFieldSelector, taskSelector } from "../../reducers/slice";
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useTaskUpdateOneFieldMutation } from "../../reducers/api";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import EditModeToggle from "./edit-mode-toggle-button";
import { createEditRightSelector } from ".";
import TextDisplayWrapper from "./text-display-wrapper";
import SimpleTextDisplay from "./simple-text-display";
import TextFieldSubmitButton from "./text-field-submit-button";
import { useRouter } from "next/router";

export interface Ioption {
    id:EntityId;
    name:string;
    order?:number;
}

const 
    sortOptions = (arr:Ioption[]) => {
        if (arr.length < 2) return arr
        return Array.from(arr).sort((a,b)=>a.order - b.order)
    },
    Dropdown = memo(({fieldID}:{fieldID:EntityId})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            valueLabelOptionSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectById(state,fieldID),
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (field:TaskField,t:Task)=>{
                    const 
                        options = field.fieldType === 'board_column' ? sortOptions(field.details.options as Ioption[]) : field.details.options as Ioption[],
                        value = t[fieldID] as EntityId,
                        label = options.find(e=>e.id===value)?.name || ''
                    return {options,value,label}
                }
            ),[fieldID,taskID]),
            {options,value,label} = useAppSelector(state => valueLabelOptionSelector(state)),
            [editMode,setEditMode] = useState(false),
            editRightSelector = useMemo(()=>createEditRightSelector(fieldID,taskID),[fieldID,taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            editOnClick = useCallback(()=>setEditMode(true),[]),
            editModeOff = useCallback(()=>setEditMode(false),[])

        return (
            <TextDisplayWrapper {...{editMode}}>
                <>
                {!editMode && <TableRow>
                    <SimpleTextDisplay {...{
                        nilTextColor:!label,
                        content:!!label ? label : 'N/A'
                    }} />
                    {hasEditRight && <EditModeToggle {...{onClick:editOnClick}} />}
                </TableRow>}
                {editMode && <Editor {...{
                    value,
                    options,
                    fieldID,
                    editModeOff
                }} />}
                </>
            </TextDisplayWrapper>
        )
    }),
    Editor = memo((
        {
            value,
            options,
            fieldID,
            editModeOff,
        }:{
            value:EntityId;
            options:Ioption[];
            fieldID:EntityId;
            editModeOff:()=>void;
        }
    )=>{
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            [tempValue,setTempValue] = useState(value),
            onChange = (e:SelectChangeEvent) => setTempValue(e.target.value),
            [updateField] = useTaskUpdateOneFieldMutation(),
            onSubmit = () => {
                updateField({
                    id:taskID,
                    field:fieldID,
                    value:tempValue
                })
                editModeOff()
            }

        return (
            <TableRow>
                <TableCell>
                    <FormControl size="small" fullWidth>
                        <Select
                            value={tempValue}
                            onChange={onChange}
                        >
                            {options.map(({id,name})=>(
                                <MenuItem value={id} key={id}>{name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </TableCell>
                <TableCell sx={{width:0}}>
                    <TextFieldSubmitButton {...{onSubmit}} />
                </TableCell>
            </TableRow>
        )
    })
Dropdown.displayName = 'Dropdown'
Editor.displayName = 'Editor'
export default Dropdown