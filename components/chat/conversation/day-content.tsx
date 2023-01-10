import { ReduxState, useAppSelector } from "@reducers";
import React, { memo, useEffect, useMemo, useRef } from "react";
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import IndividualConvo from "./individual-convo";
import { useTheme } from '@mui/material/styles';
import { createSelector } from "@reduxjs/toolkit";
import { chatConvoSelector, chatRoomSelector } from "../reducers/slice";
import { Room } from "../interfaces";
import { useRouter } from "next/router";

const ChatDayContent = memo(({date}:{date:number})=>{
    const 
        {palette:{mode,secondary}} = useTheme(),
        {query} = useRouter(),
        roomID = query.roomid as string,
        convoIDsSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (r:Room)=>{
                const 
                    convos = chatConvoSelector.selectAll(r),
                    d = new Date(date),
                    dayEnd = new Date(d.getFullYear(),d.getMonth(),d.getDate() + 1).valueOf(),
                    convoIDs = convos
                        .filter(({dt})=> dt >= date && dt < dayEnd)
                        .sort((a,b)=>a.dt - b.dt)
                        .map(({id})=>id)

                return convoIDs
            }
        ),[roomID]),
        convoIDs = useAppSelector(state=>convoIDsSelector(state)),
        dateRef = useRef<HTMLDivElement>(),
        dayContainer = useRef<HTMLDivElement>(),
        timeoutRef = useRef<NodeJS.Timeout>(),
        dismissDate = () => {
            if (!!dateRef.current) dateRef.current.style.opacity = '0'
        },
        onScroll = (e:any) => {
            if (!dateRef.current) return
            clearTimeout(timeoutRef.current)
            dateRef.current.style.opacity = '1'
            const t = e.currentTarget as HTMLElement;

            const
                {top:dateContainerTop} = dayContainer.current.getBoundingClientRect(),
                {top:containerTop} = t.getBoundingClientRect()

            if (dateContainerTop < containerTop - 20) timeoutRef.current = setTimeout(dismissDate,300)
        }

    useEffect(()=>{
        const elem = document.getElementById('convo-window')
        elem.addEventListener('scroll',onScroll,{passive:true})
        return () => window.removeEventListener('scroll',onScroll)
    },[])

    return (
        <Grid 
            ref={dayContainer}
            container 
            direction='column' 
            sx={{
                position:'relative',
                '.highlight':{
                    color:secondary[mode==='light' ? 'dark' : 'main']
                }
            }}
        >
            <Grid 
                sx={{
                    position:'sticky',
                    top:10,
                    justifyContent:'center',
                    my:1,
                    pointerEvents:'none',
                    transition:'opacity 0.5s',
                }} 
                container 
                direction='row'
                id={`${date}`}
                ref={dateRef}
            >
                <Typography 
                    sx={{
                        fontSize:'0.8rem',
                        backgroundColor:mode === 'light' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                        borderRadius:100,
                        px:1,
                    }}
                >
                    {new Date(date).toLocaleDateString('en',{month:'short',day:'numeric',...(new Date().getFullYear() !== new Date(date).getFullYear() && {year:'numeric'})})}
                </Typography>
            </Grid>
            {convoIDs.map((c,i)=>(
                <IndividualConvo key={i} id={c} />
            ))}
        </Grid>
    )
})

ChatDayContent.displayName = 'ChatDayContent'
export default ChatDayContent