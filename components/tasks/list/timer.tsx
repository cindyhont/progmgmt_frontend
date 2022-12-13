import { createSelector, EntityId } from '@reduxjs/toolkit';
import React, { useEffect, useMemo, useRef } from 'react'
import TableCell from "@mui/material/TableCell";
import { ReduxState, useAppSelector } from '@reducers';
import { taskTimeRecordsSelector } from '../reducers/slice';
import { TaskTimeRecord } from '../interfaces';
import Typography from '@mui/material/Typography'
import { numberToInterval } from '@components/functions';

const 
    TimeAccumulated = (
        {
            id,
            onDragEnter,
        }:{
            id:EntityId;
            onDragEnter:()=>void;
        }
    ) => {
        const 
            oldRecordsTimeSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===id && !!e.end),
                (records:TaskTimeRecord[])=>{
                    if (!records.length) return 0
                    return records.map(e=>e.end - e.start).reduce((prev,curr)=>!prev ? curr : prev + curr)
                }
            ),[id]),
            oldRecordsTime = useAppSelector(state => oldRecordsTimeSelector(state)),
            runningRecordStartTimes = useAppSelector(state => taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===id && !e.end).map(e=>e.start))
            

        return (
            <TableCell
                className={`timer task-list-body-cell`}
                onDragEnter={onDragEnter} 
                data-field='timer'
                data-taskid={id}
            >
                {runningRecordStartTimes.length===0 && <Typography sx={{fontSize:'0.9rem'}}>{numberToInterval(oldRecordsTime)}</Typography>}
                {runningRecordStartTimes.length!==0 && <Counting {...{oldRecordsTime,runningRecordStartTimes}} />}
            </TableCell>
        )
    },
    Counting = (
        {
            oldRecordsTime,
            runningRecordStartTimes
        }:{
            oldRecordsTime:number;
            runningRecordStartTimes:number[];
        }
    ) => {
        const 
            ref = useRef<HTMLParagraphElement>(),
            timeoutRef = useRef<NodeJS.Timeout>(),
            pageVisibility = useAppSelector(state => state.misc.pageVisibility),
            showTime = () => {
                const 
                    now = Date.now(),
                    final = runningRecordStartTimes.map(e=>now - e).reduce((p,c)=>!p ? c : p + c) + oldRecordsTime
                ref.current.innerText = numberToInterval(final)
                timeoutRef.current = setTimeout(showTime,1000 - (now % 1000))
            }

        useEffect(()=>{
            if (pageVisibility) showTime()
            return () => clearTimeout(timeoutRef.current)
        },[pageVisibility])

        return (
            <Typography sx={{fontSize:'0.9rem'}} />
        )
    }

export default TimeAccumulated