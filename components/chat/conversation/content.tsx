import React, { ForwardedRef, forwardRef, memo, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useUpdateChatLastSeenMutation } from '../reducers/api';
import { ReduxState, useAppSelector } from '@reducers';
import ChatDayContent from './day-content';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { chatConvoSelector, chatRoomSelector, chatRoomUserSelector } from '../reducers/slice';
import { Room } from '../interfaces';
import { userDetailsSelector } from '@reducers/user-details/slice';
import { useRouter } from 'next/router';
import useEllipsis from 'hooks/counter/ellipsis';

const 
    ChatContent = memo(forwardRef((_,ref:ForwardedRef<HTMLDivElement>)=>{
        const 
            {query} = useRouter(),
            roomID = query.roomid as string
        
        return (
            <Grid 
                container 
                direction='column' 
                ref={ref}
                id='chat-content'
            >
                {!!roomID && <RoomContent />}
            </Grid>
        )
    })),
    RoomContent = () => {
        const
            {query} = useRouter(),
            roomID = query.roomid as string,
            datesSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (r:Room)=>{
                    const convos = chatConvoSelector.selectAll(r)
                    return Array.from(new Set(convos.map(({dt})=>{
                        const 
                            dateTime = new Date(dt),
                            year = dateTime.getFullYear(),
                            month = dateTime.getMonth(),
                            date = dateTime.getDate()
                        return new Date(year, month, date).valueOf()
                    }))).sort()
                }
            ),[roomID]),
            dates = useAppSelector(state=>datesSelector(state)),
            lastConvoDtSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (r:Room)=>{
                    const convos = chatConvoSelector.selectAll(r)
                    return convos.length===0 ? 0 : convos.map(({dt})=>dt).sort((a,b)=>b-a)[0]
                }
            ),[roomID]),
            lastConvoDT = useAppSelector(state => lastConvoDtSelector(state)),
            roomUsersIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (r:Room)=>chatRoomUserSelector.selectAll(r).map(({id})=>id),
            ),[roomID]),
            roomUserIDs = useAppSelector(state => roomUsersIdSelector(state)),
            [updateLastSeen] = useUpdateChatLastSeenMutation()

        useEffect(()=>{
            if (lastConvoDT !== 0) updateLastSeen(roomID)
        },[lastConvoDT])
        
        return (
            <>
            {dates.map(d => (
                <ChatDayContent key={d} date={d} />
            ))}
            {roomUserIDs.map((userID,i)=>(
                <Typing key={i} {...{userID}} />
            ))}
            </>
        )
    },
    Typing = memo((
        {
            userID,
        }:{
            userID:EntityId;
        }
    )=>{
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            ellipsis = useEllipsis(),
            selector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (state:ReduxState,r:Room)=>({
                    name:userDetailsSelector.selectById(state,userID).firstName,
                    typing:chatRoomUserSelector.selectById(r,userID).typing
                })
            ),[userID,roomID]),
            {name,typing} = useAppSelector(state=>selector(state)),
            theme = useTheme()

        return (
            <Typography
                sx={{
                    fontSize:'0.8rem',
                    fontStyle:'italic',
                    overflow:'hidden',
                    lineHeight:'1rem',
                    color:theme.palette.mode === 'light' ? theme.palette.grey[600] : theme.palette.grey[500],
                    height:typing ? '1rem':'0rem',
                    transition:'all 0.3s'
                }}
            >{name} is typing {ellipsis}</Typography>
        )
    })

ChatContent.displayName = 'ChatContent'
Typing.displayName = 'Typing'
export default ChatContent