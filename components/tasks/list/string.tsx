import React, { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import { useAppDispatch, useAppSelector } from "@reducers";
import { taskEditSingleField, taskSelector } from "../reducers/slice";
import { EntityId } from "@reduxjs/toolkit";
import Typography from "@mui/material/Typography";
import taskApi from "../reducers/api";

const 
    StringElem = (
        {
            id,
            field,
            editMode
        }:{
            id:EntityId;
            field:EntityId;
            editMode:boolean;
        }
    ) => {
        const 
            value = useAppSelector(state => taskSelector.selectById(state,id)[field]),
            dispatch = useAppDispatch(),
            editModeOff = useCallback(()=>dispatch(taskEditSingleField(false)),[])

        return (
            <TableCell 
                className={`${field.toString()} task-list-body-cell`}
                data-field={field}
                data-taskid={id}
                sx={{
                    ...(editMode && {p:0})
                }}
            >
                {!editMode && <Grid sx={{display:'grid'}}>
                    <Typography 
                        sx={{
                            fontSize:'0.9rem',
                            textOverflow:'ellipsis',
                            overflow: 'hidden', 
                            whiteSpace: 'nowrap',
                        }}
                    >{value}</Typography>
                </Grid>}
                {editMode && <EditString {...{id,field,value,editModeOff}} />}
            </TableCell>
        )
    },
    EditString = (
        {
            editModeOff,
            value,
            id,
            field,
        }:{
            editModeOff:()=>void;
            value:string;
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            ref = useRef<HTMLInputElement>(),
            dispatch = useAppDispatch(),
            onBlur = () => {
                if (ref.current.value !== value) dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:ref.current.value}))
                editModeOff()
            }

        useEffect(()=>{
            ref.current.value = value
            ref.current.focus()
        },[])

        return (
            <TextField 
                inputRef={ref}
                fullWidth
                onBlur={onBlur}
                size='small'
            />
        )
    }

export default StringElem;