import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { memo, useMemo } from "react";
import { taskApprovalItemSelector, taskEditSingleField, taskSelector, updateCtxMenuIDs } from "../../reducers/slice";
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { useTheme } from "@mui/material";
import { interpolateColorString } from "@components/functions";
import { Task } from "../../interfaces";
import Button from '@mui/material/Button'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useRouter } from "next/router";

const Approval = memo(()=>{
    const
        {palette:{mode,error,primary,getContrastText}} = useTheme(),
        router = useRouter(),
        taskID = router.query.taskid as string,
        approvalStatusSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskSelector.selectById(state,taskID),
            (state:ReduxState)=>state,
            (task:Task,state:ReduxState)=>({
                approvalText:taskApprovalItemSelector.selectById(state,task.approval).name,
                color:interpolateColorString(error[mode],primary[mode],+task.approval)
            })
        ),[mode,taskID]),
        editRightSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state.misc.uid,
            (state:ReduxState)=>taskSelector.selectById(state,taskID),
            (uid:EntityId,task:Task)=>[...task.supervisors,task.owner].includes(uid)
        ),[taskID]),
        editRight = useAppSelector(state => editRightSelector(state)),
        {color,approvalText} = useAppSelector(state => approvalStatusSelector(state)),
        dispatch = useAppDispatch(),
        menuOpen = useAppSelector(state => state.taskMgmt.editField),
        editOnClick = () => {
            dispatch(updateCtxMenuIDs({field:'approval',taskid:taskID}))
            dispatch(taskEditSingleField(true))
        }

    return (
        <Box
            sx={{
                px:1.5,
                pb:1.5
            }}
        >
            <Button 
                fullWidth
                {...{
                    variant:'contained',
                    sx:{
                        backgroundColor:color,
                        '&:hover':{
                            backgroundColor:color,
                        },
                        justifyContent:'space-between'
                    },
                    ...(editRight && {
                        endIcon:<ExpandMoreRoundedIcon 
                            sx={{
                                transform:`rotate(${menuOpen ? '180' : '0'}deg)`,
                                transition:'transform 0.3s',
                                fill:getContrastText(color),
                            }} 
                        />,
                        onClick:editOnClick
                    })
                }}
                id={`approval-${taskID}`}
            >
                <Typography
                    sx={{
                        color:getContrastText(color),
                        textTransform:'capitalize',
                    }}
                >{approvalText}</Typography>
            </Button>
        </Box>
    )
})
Approval.displayName = 'Approval'
export default Approval