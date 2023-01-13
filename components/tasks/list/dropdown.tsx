import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useMemo } from "react";
import { taskFieldSelector, taskSelector } from "../reducers/slice";
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import taskApi from "../reducers/api";

export interface Ioption {
    id:EntityId;
    name:string;
}

const 
    DropdownElem = (
        {
            id,
            field,
            hasEditRight,
        }:{
            id:EntityId;
            field:EntityId;
            hasEditRight:boolean;
        }
    ) => (
        <TableCell
            className={`${field.toString()} task-list-body-cell`}
            data-field={field}
            data-taskid={id}
            sx={{...(hasEditRight && {p:0})}}
        >
            {!hasEditRight && <ReadOnly {...{id,field}} />}
            {hasEditRight && <ReadWrite {...{id,field}} />}
        </TableCell>
    ),
    ReadOnly = (
        {
            id,
            field,
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            labelSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,id)[field] as EntityId,
                (state:ReduxState)=>taskFieldSelector.selectById(state,field).details.options as Ioption[],
                (value:EntityId,options:Ioption[])=>options.find(e=>e.id===value)?.name || ''
            ),[id,field]),
            label = useAppSelector(state => labelSelector(state))
            
        return (
            <Typography sx={{fontSize:'0.9rem'}}>{label}</Typography>
        )
    },
    ReadWrite = (
        {
            id,
            field,
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const
            options = useAppSelector(state => taskFieldSelector.selectById(state,field).details.options as Ioption[]),
            value = useAppSelector(state => taskSelector.selectById(state,id)[field] ?? null),
            dispatch = useAppDispatch(),
            handleChange = (e: SelectChangeEvent) => {
                const newVal = e.target.value
                if (newVal !== value) dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:newVal}))
            }

        return (
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={value}
                onChange={handleChange}
                sx={{
                    '.MuiSelect-select':{
                        py:1
                    },
                    fontSize:'0.9rem'
                }}
                fullWidth
            >
                {options.map(({id,name})=>(
                    <MenuItem value={id} key={id} sx={{fontSize:'0.9rem'}}>{name}</MenuItem>
                ))}
            </Select>
        )
    }

export default DropdownElem