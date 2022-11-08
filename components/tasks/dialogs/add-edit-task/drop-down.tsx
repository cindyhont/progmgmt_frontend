import React, { memo, useContext, useEffect, useMemo, useRef } from "react";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import { v4 as uuidv4 } from 'uuid'
import { Context } from ".";
import { editTextFieldAction } from "./reducer";
import { taskFieldSelector } from "@components/tasks/reducers/slice";
import { TaskField } from "@components/tasks/interfaces";

const 
    DropDown = memo((
        {
            label,
            value,
            id
        }:{
            label:string;
            value:string;
            id:EntityId;
        }
    )=>{
        const
            {addEditTaskDispatch} = useContext(Context),
            optionsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectById(state,id),//taskCustomFieldSelector.selectById(state,id),
                (field:TaskField)=>field.details.options as {id:EntityId;name:string;order:number;}[]
            ),[id]),
            labelID = useRef(uuidv4()).current,
            options = useAppSelector(state=>optionsSelector(state)),
            onChange = (e: SelectChangeEvent) => addEditTaskDispatch(editTextFieldAction({key:id as string,value:e.target.value}))

        return (
            <>
            {value !== undefined && <FormControl fullWidth>
                <InputLabel id={labelID}>{label}</InputLabel>
                <Select
                    labelId={labelID}
                    value={value}
                    label={label}
                    onChange={onChange}
                >
                    {options.map(({id,name})=>(
                        <MenuItem value={id} key={id}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>}
            </>
        )
    })

DropDown.displayName = 'DropDown'
export default DropDown