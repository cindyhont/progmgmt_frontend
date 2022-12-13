import { interpolateColorString } from "@components/functions";
import { useTheme } from "@mui/material";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useMemo } from "react";
import { taskApprovalItemSelector, taskEditSingleField, taskSelector, updateCtxMenuIDs } from "../reducers/slice";
import TableCell from '@mui/material/TableCell';
import Chip from '@mui/material/Chip'
import EditRoundedIcon from '@mui/icons-material/EditRounded';

const Approval = (
    {
        id,
        onDragEnter,
        hasEditRight,
    }:{
        id:EntityId;
        onDragEnter:()=>void;
        hasEditRight:boolean;
    }
)=>{
    const
        {palette:{mode,error,primary,getContrastText}} = useTheme(),
        approvalStatusSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>{
                const
                    approvalStatus = taskSelector.selectById(state,id).approval,
                    approvalText = taskApprovalItemSelector.selectById(state,approvalStatus).name,
                    color = interpolateColorString(error[mode],primary[mode],+approvalStatus)
                return {color,approvalText}
            }
        ),[mode,id]),
        {color,approvalText} = useAppSelector(state => approvalStatusSelector(state)),
        dispatch = useAppDispatch(),
        editOnClick = () => {
            dispatch(updateCtxMenuIDs({field:'approval',taskid:id}))
            dispatch(taskEditSingleField(true))
        }

    return (
        <TableCell 
            className={`approval task-list-body-cell`}
            onDragEnter={onDragEnter}
            data-field='approval'
            data-taskid={id}
            sx={{p:0,pl:2}}
        >
            <Chip 
                {...{
                    label:approvalText,
                    sx:{
                        backgroundColor:color,
                        color:getContrastText(color),
                        textTransform:'capitalize',
                    },
                    deleteIcon:<EditRoundedIcon />,
                    ...(hasEditRight && {onDelete:editOnClick})
                }} 
                data-nottotask='true'
                id={`approval-${id}`}
            />
        </TableCell>
    )
}

export default Approval