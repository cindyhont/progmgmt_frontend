import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { memo, useMemo } from "react";
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import { taskApprovalItemSelector, taskSelector } from "../reducers/slice";
import { Task } from "../interfaces";
import { ReduxState, useAppSelector } from "@reducers";
import { capitalize, useTheme } from "@mui/material";
import { interpolateColorString } from "@components/functions";
import Tooltip from '@mui/material/Tooltip';
import { grey } from '@mui/material/colors';

const 
    ChildTasksStatus = (
        {
            id,
        }:{
            id:EntityId;
        }
    ) => {
        const 
            {palette:{mode,error,primary}} = useTheme(),
            contentSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectAll(state).filter(e=>e.parents.length > 1 && e.parents[e.parents.length - 2]===id),
                (state:ReduxState)=>state,
                (tasks:Task[],state:ReduxState)=>{
                    const result = tasks.map(t=>({
                        taskName:t.name,
                        bgColor:interpolateColorString(error[mode],primary[mode],+t.approval),
                        status:+t.approval,
                        statusDesc:taskApprovalItemSelector.selectById(state,t.approval).name.split(' ').map(e=>capitalize(e)).join(' ')
                    }))
                    return result.length < 2 ? result : result.sort((a,b)=>a.status - b.status)
                }
            ),[id]),
            content = useAppSelector(state => contentSelector(state))

        return (
            <TableCell 
                sx={{...(content.length !== 0 && {p:0,position:'relative'})}}
                data-field='child-status'
                data-taskid={id}
            >
                {content.length===0 ? <Typography sx={{color:grey[500],fontSize:'0.9rem'}}>(No Childrem)</Typography> : <Stack 
                    direction='row'
                    sx={{
                        position:'absolute',
                        top:'0px',
                        bottom:'0px',
                        left:'0px',
                        right:'-3px'
                    }}
                >
                    {content.map((e,i)=>(
                        <ChildTaskContent key={i} {...{...e,width:`${100 / content.length}%`}} />
                    ))}
                </Stack>}
            </TableCell>
        )
    },
    ChildTaskContent = memo((
        {
            taskName,
            bgColor,
            statusDesc,
            width
        }:{
            taskName:string;
            bgColor:string;
            statusDesc:string;
            width:string;
        }
    )=>{
        const {palette:{background}} = useTheme()
        return (
            <Tooltip title={`${taskName}: ${statusDesc}`}>
                <Box sx={{backgroundColor:bgColor,width,borderLeft:`1px solid ${background.default}`}} />
            </Tooltip>
        )
    })
ChildTaskContent.displayName = 'ChildTaskContent'
export default ChildTasksStatus