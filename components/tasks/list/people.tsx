import { ReduxState, useAppSelector } from "@reducers";
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import TableCell from '@mui/material/TableCell';
import { userDetailsSelector } from "@reducers/user-details/slice";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useMemo, } from "react";
import { taskSelector } from "@components/tasks/reducers/slice";
import { Task } from "@components/tasks/interfaces";

const 
    createPeopleSelector = (id:EntityId,field:EntityId) => createSelector(
        (state:ReduxState)=>state,
        (state:ReduxState)=>taskSelector.selectById(state,id),
        (state:ReduxState,task:Task) => {
            if (!task[field]) return []

            const 
                userIDs = task[field] as EntityId[],
                userDetails = userIDs
                    .filter(userID => !!userDetailsSelector.selectById(state,userID))
                    .map(userID => {
                        const {firstName,lastName,avatar,id} = userDetailsSelector.selectById(state,userID)
                        return {firstName,lastName,avatar,id}
                    })

            return userDetails
        }
    ),
    People = (
        {
            id,
            field,
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => (
        <TableCell 
            className={`${field.toString()} task-list-body-cell`}
            data-field={field}
            data-taskid={id}
        >
            <Content {...{id,field}} />
        </TableCell>
    ),
    Content = (
        {
            id,
            field
        }:{
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            peopleSelector = useMemo(()=>createPeopleSelector(id,field),[id,field]),
            people = useAppSelector(state => peopleSelector(state))

        if (people.length !== 0) return (
            <Tooltip title='Double click for full list'>
                <AvatarGroup max={4} sx={{width:'fit-content',cursor:'pointer'}}>
                    {people.map(({firstName,lastName,avatar},i)=>(
                        <Avatar src={avatar} key={i} sx={{width:30,height:30,fontSize:'0.8rem'}}>{`${firstName[0]}${lastName[0]}`.trim()}</Avatar>
                    ))}
                </AvatarGroup>
            </Tooltip>
        )
        else return <></>
    }

export default People