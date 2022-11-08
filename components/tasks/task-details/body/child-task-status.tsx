import React, { memo, useMemo, useState } from "react";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import { useRouter } from "next/router";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import { taskApprovalItemSelector, taskSelector } from "@components/tasks/reducers/slice";
import Box from '@mui/material/Box'
import { userDetailsSelector } from "@reducers/user-details/slice";
import { useTheme } from "@mui/material";
import { interpolateColorString } from "@components/functions";
import Typography from '@mui/material/Typography';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import IndeterminateCheckBoxOutlinedIcon from '@mui/icons-material/IndeterminateCheckBoxOutlined';
import Avatar from '@mui/material/Avatar'
import Stack from '@mui/material/Stack'
import Tooltip from "@mui/material/Tooltip";
import { BlankMessage } from "@components/common-components";

const 
    ChildTaskStatus = memo(({display}:{display:boolean})=>{
        const
            taskID = useRouter().query.taskid as string,
            childTaskCount = useAppSelector(state => taskSelector.selectAll(state).filter(e=>e.parents.includes(taskID)).length)
            
        return (
            <Box sx={{display:display ? 'block' :'none'}}>
                {childTaskCount===1 ? <BlankMessage text='This task has no child task.' /> : <TaskItem taskID={taskID} level={0} />}
            </Box>
        )
    }),
    TaskItem = memo((
        {
            taskID,
            level
        }:{
            taskID:EntityId;
            level:number;
        }
    )=>{
        const 
            {palette:{mode,error,primary,grey}} = useTheme(),
            taskDetailsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,taskID)
                    if (!task) return {
                        childrenIDs:[],
                        taskName:'',
                        avatar:'',
                        ownerName:'',
                        color:error[mode],
                        statusDesc:''
                    }
                    const 
                        owner = userDetailsSelector.selectById(state,task.owner),
                        children = taskSelector.selectAll(state).filter(e=>e.parents.length > 1 && e.parents.indexOf(taskID)===e.parents.length - 2),
                        len = children.length,
                        childrenIDs = !len ? [] : len===1 ? [children[0].id] : Array.from(children).sort((a,b)=>+a.approval - (+b.approval)).map(({id})=>id)

                    return {
                        taskName:task.name,
                        childrenIDs,
                        avatar:owner?.avatar || '',
                        ownerName:!!owner ? `${owner.firstName} ${owner.lastName}` : '',
                        color:interpolateColorString(error[mode],primary[mode],+task.approval),
                        statusDesc:taskApprovalItemSelector.selectById(state,task.approval)?.name || ''
                    }

                }
            ),[taskID,mode]),
            {childrenIDs,taskName,avatar,ownerName,statusDesc,color} = useAppSelector(state => taskDetailsSelector(state)),
            maxChildTaskLvl = useAppSelector(state => state.misc.maxChildTaskLvl),
            [open,setOpen] = useState(level===0),
            onChange = () => setOpen(prev => !prev),
            TooltipContent = () => (
                <p style={{margin:'0px'}}>Owner: {ownerName}<br />Status: {statusDesc}</p>
            )

        return (
            <Accordion 
                expanded={open && !!childrenIDs.length} 
                onChange={onChange}
                disableGutters
            >
                <Tooltip 
                    title={<TooltipContent />}
                    enterDelay={1000}
                    enterNextDelay={1000}
                    enterTouchDelay={1000}
                >
                    <AccordionSummary
                        expandIcon={(!open && childrenIDs.length !== 0 && level < maxChildTaskLvl) ? <AddBoxOutlinedIcon /> : <IndeterminateCheckBoxOutlinedIcon />}
                        sx={{
                            flexDirection:'row-reverse',
                            pl:1,
                            '.Mui-expanded':{
                                transform:'none',
                                my:0
                            },
                            ...((!childrenIDs.length || level === maxChildTaskLvl) && {
                                '.MuiAccordionSummary-expandIconWrapper svg':{
                                    fill:grey[500]
                                }
                            }),
                            borderLeft:`8px solid ${color}`,
                            '&:hover:not(.Mui-disabled)':{
                                cursor:childrenIDs.length !== 0 && level < maxChildTaskLvl ? 'pointer' : 'default'
                            }
                        }}
                    >
                        <Stack direction='row' sx={{justifyContent:'space-between',width:'100%'}}>
                            <Typography sx={{ml:1}}>{taskName}</Typography>
                            <Avatar src={avatar} sx={{width:25,height:25}} />
                        </Stack>
                    </AccordionSummary>
                </Tooltip>
                {(childrenIDs.length !== 0 && level <= maxChildTaskLvl) && <AccordionDetails sx={{py:0,pr:0}}>
                    {childrenIDs.map(e=>(
                        <TaskItem key={e} taskID={e} level={level+1} />
                    ))}
                </AccordionDetails>}
            </Accordion>
        )
    })
ChildTaskStatus.displayName = 'ChildTaskStatus'
TaskItem.displayName = 'TaskItem'
export default ChildTaskStatus