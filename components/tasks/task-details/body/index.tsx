import React, { memo, SyntheticEvent, useMemo, useRef, useState } from 'react'
import Stack from '@mui/material/Stack'
import Description from './description'
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Activities from './activities';
import WorkTime from './work-time';
import Comments from './comments';
import { useRouter } from 'next/router';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { ReduxState, useAppSelector } from '@reducers';
import { taskSelector } from '@components/tasks/reducers/slice';
import { Task } from '@components/tasks/interfaces';
import ChildTaskStatus from './child-task-status';

const Body = memo(()=>{
    const 
        tabLabels = useRef(['Comments','Activities','Work Time']).current,
        [tabValue,setTabValue] = useState(0),
        handleChange = (_:SyntheticEvent,v:number) => setTabValue(v),
        taskID = useRouter().query.taskid as string,
        canReadStatusSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskSelector.selectById(state,taskID),
            (state:ReduxState)=>state.misc.uid,
            (task:Task,uid:EntityId)=>{
                if (!task) return false
                return [...task.supervisors,task.owner].includes(uid)
            }
        ),[taskID]),
        canReadStatus = useAppSelector(state => canReadStatusSelector(state))

    return (
        <Stack direction='column' spacing={2}>
            <Description />
            <Stack direction='column'>
                <Tabs value={tabValue} onChange={handleChange} variant='scrollable'>
                    {tabLabels.map((label,i)=>(
                        <Tab key={i} label={label} value={i} sx={{fontSize:'0.7rem',fontWeight:'bold',letterSpacing:'0.05rem',}} />
                    ))}
                    {canReadStatus && <Tab label='Child Tasks Status' value={tabLabels.length} sx={{fontSize:'0.7rem',fontWeight:'bold',letterSpacing:'0.05rem',}} />}
                </Tabs>
                <Comments display={tabValue===0} />
                <Activities display={tabValue===1} />
                <WorkTime display={tabValue===2} />
                <ChildTaskStatus display={tabValue===3} />
            </Stack>
        </Stack>
    )
})
Body.displayName = 'Body'
export default Body