import { useAppDispatch, useAppSelector } from "@reducers";
import { EntityId } from "@reduxjs/toolkit";
import React, { FormEvent, useCallback, useEffect, useRef } from "react";
import { taskEditSingleField, taskSelector } from "../reducers/slice";
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import TableCell from '@mui/material/TableCell';
import Typography from "@mui/material/Typography";
import taskApi from "../reducers/api";
import Box from "@mui/material/Box";

const 
    NumberElem = (
        {
            id,
            field,
            hasEditRight,
            editMode,
        }:{
            id:EntityId;
            field:EntityId;
            hasEditRight:boolean;
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
                {editMode && <EditNumber {...{id,field,value,editModeOff}} />}
            </TableCell>
        )
    },
    EditNumber = (
        {
            editModeOff,
            value,
            id,
            field,
        }:{
            editModeOff:()=>void;
            value:number;
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            ref = useRef<HTMLInputElement>(),
            submitBtnRef = useRef<HTMLInputElement>(),
            dispatch = useAppDispatch(),
            onSubmit = (e:FormEvent) => {
                e.preventDefault()
                if (ref.current.value !== value.toString()) {
                    const v = +ref.current.value
                    dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:isNaN(v) ? 0 : v}))
                }
                editModeOff()
            },
            onBlur = () => submitBtnRef.current.click()

        useEffect(()=>{
            ref.current.value = value.toString()
            ref.current.focus()
        },[])

        return (
            <Box
                component='form'
                onSubmit={onSubmit}
            >
                <TextField 
                    inputRef={ref}
                    fullWidth
                    onBlur={onBlur}
                    inputProps={{
                        inputMode: 'numeric', 
                        pattern: '[0-9]+([\.][0-9]+)?'
                    }}
                    size='small'
                />
                <input type='submit' hidden ref={submitBtnRef} />
            </Box>
        )
    }

export default NumberElem