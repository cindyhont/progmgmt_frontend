import React, { useMemo, useCallback } from "react";
import Grid from '@mui/material/Grid';
import TableCell from '@mui/material/TableCell';
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { taskEditSingleField, taskSelector } from "../reducers/slice";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { Task } from '../interfaces'
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import { userDetailsSelector } from "@reducers/user-details/slice";
import SingleUserSearchField from "./single-user-search-field";

const 
    SinglePerson = (
        {
            id,
            field,
            editMode,
        }:{
            id:EntityId;
            field:EntityId;
            editMode:boolean;
        }
    ) => {
        const 
            personSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>taskSelector.selectById(state,id),
                (state:ReduxState,task:Task) => userDetailsSelector.selectById(state,task[field])
            ),[id,field]),
            avatar = useAppSelector(state=>personSelector(state) ? personSelector(state).avatar : ''),
            firstName = useAppSelector(state=>personSelector(state) ? personSelector(state).firstName : ''),
            lastName = useAppSelector(state=>personSelector(state) ? personSelector(state).lastName : ''),
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
                {!editMode && `${avatar}${firstName}${lastName}`!=='' && <Grid container direction='row'>
                    <Avatar src={avatar} sx={{width:30,height:30,mr:1}} />
                    <Typography sx={{fontSize:'0.85rem',lineHeight:'30px'}}>{`${firstName} ${lastName}`.trim()}</Typography>
                </Grid>}
                {editMode && <SingleUserSearchField {...{
                    id,
                    field,
                    editModeOff,
                }} />}
            </TableCell>
        )
    }

export default SinglePerson