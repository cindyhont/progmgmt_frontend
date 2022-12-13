import React, { memo, useEffect, useMemo, useRef } from "react";
import Grid from '@mui/material/Grid'
import IconButton from "@mui/material/IconButton";
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import { useTheme } from "@mui/material";
import StopIcon from '@mui/icons-material/Stop';
import Typography from "@mui/material/Typography";
import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { useStore } from "react-redux";
import { timerIntervalToString } from "@components/functions";
import Stack from '@mui/material/Stack'
import { taskTimeRecordsSelector } from "@components/tasks/reducers/slice";
import { useTaskUpdateMyTimerMutation } from "@components/tasks/reducers/api";
import { useRouter } from "next/router";

const 
    Timer = memo(()=>{
        const
            theme = useTheme(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            timerOnSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.misc.uid,
                (state:ReduxState)=>state,
                (uid:EntityId,state:ReduxState)=>taskTimeRecordsSelector.selectAll(state).findIndex(r=>r.taskID===taskID && r.uid===uid && !r.end) !== -1
            ),[taskID]),
            timerOn = useAppSelector(state => timerOnSelector(state)),
            timeDisplay = useRef<HTMLParagraphElement>(),
            time = useRef(0),
            timeoutRef = useRef<NodeJS.Timeout>(),
            store = useStore(),
            pageVisibility = useAppSelector(state => state.misc.pageVisibility),
            showTime = () => {
                const diff = Date.now() - time.current
                timeDisplay.current.innerText = timerIntervalToString(diff)
                timeoutRef.current = setTimeout(showTime,1000 - (diff % 1000))
            },
            [updateMyTimer] = useTaskUpdateMyTimerMutation(),
            onClick = () => updateMyTimer(taskID),
            cancelTimeout = () => {
                time.current = 0
                clearTimeout(timeoutRef.current)
            }

        useEffect(()=>{
            if (timerOn && pageVisibility){
                const state = store.getState() as ReduxState
                time.current = taskTimeRecordsSelector.selectAll(state).find(r=>r.taskID===taskID && r.uid===state.misc.uid && !r.end).start

                showTime()
            } else cancelTimeout()
            return () => cancelTimeout()
        },[timerOn,taskID,pageVisibility])

        useEffect(()=>{
            return () => cancelTimeout()
        },[])

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
                    ref={timeDisplay}
                />
            </Stack>
        )
    })
Timer.displayName = 'Timer'
export default Timer