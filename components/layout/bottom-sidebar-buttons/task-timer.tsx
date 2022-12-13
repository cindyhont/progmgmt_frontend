import { TaskTimeRecord } from "@components/tasks/interfaces";
import { taskSelector, taskTimeRecordsSelector } from "@components/tasks/reducers/slice";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { useEffect, useMemo, useRef } from "react";
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import StopIcon from '@mui/icons-material/Stop';
import { useStore } from "react-redux";
import { useTaskUpdateMyTimerMutation } from "@components/tasks/reducers/api";
import { timerIntervalToString } from "@components/functions";

const TaskTimer = () => {
    const 
        taskNameSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskTimeRecordsSelector.selectAll(state),
            (state:ReduxState)=>state.misc.uid,
            (state:ReduxState)=>state,
            (timeRecords:TaskTimeRecord[],uid:EntityId,state:ReduxState)=>{
                const timerRunning = timeRecords.find(r=>!r.end && r.uid===uid)
                return !!timerRunning ? taskSelector.selectById(state,timerRunning.taskID).name : null
            }
        ),[]),
        taskName = useAppSelector(state => taskNameSelector(state)),
        store = useStore(),
        time = useRef(0),
        timeoutRef = useRef<NodeJS.Timeout>(),
        timeDisplay = useRef<HTMLSpanElement>(),
        [updateMyTimer] = useTaskUpdateMyTimerMutation(),
        onClick = () => {
            const
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                timerRunning = taskTimeRecordsSelector.selectAll(state).find(r=>!r.end && r.uid===uid)
            if (!timerRunning) return
            updateMyTimer(timerRunning.taskID)
        },
        pageVisibility = useAppSelector(state => state.misc.pageVisibility),
        showTime = () => {
            const diff = Date.now() - time.current
            timeDisplay.current.innerText = timerIntervalToString(diff)
            timeoutRef.current = setTimeout(showTime,1000 - (diff % 1000))
        },
        cancelLoop = () => {
            time.current = 0
            clearTimeout(timeoutRef.current)
        }

    useEffect(()=>{
        if (!!taskName && pageVisibility){
            const
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                timerRunning = taskTimeRecordsSelector.selectAll(state).find(r=>!r.end && r.uid===uid)
            time.current = timerRunning.start
            showTime()
        } else cancelLoop()
        return () => cancelLoop()
    },[!!taskName,pageVisibility])

    return (
        <ListItemButton component='li' onClick={onClick} sx={{display:!!taskName ? 'flex' : 'none'}}>
            <ListItemIcon>
                <StopIcon fontSize="large" />
            </ListItemIcon>
            <ListItemText primary={taskName} secondary={<span ref={timeDisplay} />} />
        </ListItemButton>
    )
}

export default TaskTimer