import React, { useMemo, useCallback, useEffect } from "react";
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
            onDragEnter,
            hasEditRight,
            editMode,
        }:{
            id:EntityId;
            field:EntityId;
            onDragEnter:()=>void;
            hasEditRight:boolean;
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
            /*
            [editMode,setEditMode] = useState(false),
            onDoubleClick = () => {
                if (hasEditRight && !editMode) setEditMode(true)
            },
            timeRef = useRef(0),
            onTouchStart = () => {
                const now = Date.now()
                if (now - timeRef.current > 500) timeRef.current = now
                else onDoubleClick()
            },
            */
            dispatch = useAppDispatch(),
            editModeOff = useCallback(()=>dispatch(taskEditSingleField(false)),[])

        // useEffect(()=>console.log(editMode),[editMode])

        return (
            <TableCell 
                className={`${field.toString()} task-list-body-cell`}
                onDragEnter={onDragEnter}
                // onDoubleClick={onDoubleClick}
                // onTouchStart={onTouchStart}
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