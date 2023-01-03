import React, { memo, useMemo } from "react";
import Grid from '@mui/material/Grid'
import IconButton from "@mui/material/IconButton";
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useTheme } from "@mui/material";
import StopIcon from '@mui/icons-material/Stop';
import Typography from "@mui/material/Typography";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { timerIntervalToString } from "@components/functions";
import Stack from '@mui/material/Stack'
import { taskTimeRecordsSelector } from "@components/tasks/reducers/slice";
import { useTaskUpdateMyTimerMutation } from "@components/tasks/reducers/api";
import { useRouter } from "next/router";
import useTaskStopwatch from "hooks/counter/task-stopwatch";

const 
    Timer = memo(()=>{
        const
            theme = useTheme(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            timerOnSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.misc.uid,
                (state:ReduxState)=>state,
                (uid:EntityId,state:ReduxState)=>{
                    const timeRecord = taskTimeRecordsSelector.selectAll(state).find(r=>r.taskID===taskID && r.uid===uid && !r.end)
                    return {timerOn:!!timeRecord, timerID:timeRecord?.id || null}
                }
            ),[taskID]),
            {timerOn,timerID} = useAppSelector(state => timerOnSelector(state)),
            increment = useTaskStopwatch(timerOn,timerID),
            [updateMyTimer] = useTaskUpdateMyTimerMutation(),
            onClick = () => updateMyTimer(taskID)

        return (
            <Stack
                direction='column'
                pb={2}
            >
                <Grid container direction='row' sx={{justifyContent:'center'}}>
                    <IconButton 
                        sx={{
                            backgroundColor:theme.palette[timerOn ? 'secondary' : 'primary'][theme.palette.mode],
                            '&:hover':{
                                backgroundColor:theme.palette[timerOn ? 'secondary' : 'primary'].main
                            }
                        }}
                        onClick={onClick}
                    >
                        {timerOn ? <StopIcon fontSize="large" sx={{fill:'#fff'}} /> : <PlayArrowRoundedIcon fontSize="large" sx={{fill:'#fff'}} />}
                    </IconButton>
                </Grid>
                <Typography 
                    sx={{
                        textAlign:'center',
                        mt:0.5,
                        display:timerOn ? 'block' : 'none'
                    }}
                >{increment !== null ? timerIntervalToString(increment) : ''}</Typography>
            </Stack>
        )
    })
Timer.displayName = 'Timer'
export default Timer