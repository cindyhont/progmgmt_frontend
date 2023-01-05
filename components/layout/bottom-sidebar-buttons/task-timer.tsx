import { TaskTimeRecord } from "@components/tasks/interfaces";
import { taskSelector, taskTimeRecordsSelector } from "@components/tasks/reducers/slice";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useMemo } from "react";
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StopIcon from '@mui/icons-material/Stop';
import { useStore } from "react-redux";
import { useTaskUpdateMyTimerMutation } from "@components/tasks/reducers/api";
import { timerIntervalToString } from "@components/functions";
import useTaskStopwatch from "hooks/counter/task-stopwatch";

const TaskTimer = () => {
    const 
        selector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskTimeRecordsSelector.selectAll(state),
            (state:ReduxState)=>state.misc.uid,
            (state:ReduxState)=>state,
            (timeRecords:TaskTimeRecord[],uid:EntityId,state:ReduxState)=>{
                const timerRunning = timeRecords.find(r=>!r.end && r.uid===uid)
                return {
                    taskName:!!timerRunning ? taskSelector.selectById(state,timerRunning.taskID).name : null,
                    timerID:timerRunning?.id || null
                }
            }
        ),[]),
        {taskName,timerID} = useAppSelector(state => selector(state)),
        increment = useTaskStopwatch(!!timerID,timerID),
        store = useStore(),
        [updateMyTimer] = useTaskUpdateMyTimerMutation(),
        onClick = () => {
            const
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                timerRunning = taskTimeRecordsSelector.selectAll(state).find(r=>!r.end && r.uid===uid)
            if (!!timerRunning) updateMyTimer(timerRunning.taskID)
        }

    return (
        <ListItemButton component='li' onClick={onClick} sx={{display:!!taskName ? 'flex' : 'none'}}>
            <ListItemIcon>
                <StopIcon fontSize="large" />
            </ListItemIcon>
            <ListItemText primary={taskName} secondary={<span>{increment !== null ? timerIntervalToString(increment) : ''}</span>} />
        </ListItemButton>
    )
}

export default TaskTimer