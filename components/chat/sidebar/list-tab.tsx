import { getClosestNextStepMS, getTimeInterval } from '@components/functions';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { ReduxState, useAppSelector } from '@reducers';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { shallowEqual } from 'react-redux';
import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Badge from '@mui/material/Badge';
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded';
import FiberNewRoundedIcon from '@mui/icons-material/FiberNewRounded';
import { chatConvoSelector, chatRoomSelector, chatRoomUserSelector } from '../reducers/slice';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { Convo, Room, RoomUser } from '../interfaces';
import { useUpdateChatLastSeenMutation } from '../reducers/api';
import { userDetailsSelector } from '@reducers/user-details/slice';
import { useRouter } from 'next/router';
import useEllipsis from 'hooks/counter/ellipsis';

const 
    ListTab = memo(({roomID}:{roomID:EntityId}) => {
        const 
            theme = useTheme(),
            multiIconsSelector = useMemo(()=>createSelector(
                (state:ReduxState) => chatRoomSelector.selectById(state,roomID),
                (state:ReduxState) => state.misc.uid,
                (r:Room,uid:EntityId) => {
                    let count = 0

                    if (r.pinned) count++

                    const 
                        users = chatRoomUserSelector.selectAll(r),
                        lastSeenUser = Array.from(users).sort((a,b)=>b.lastSeen - a.lastSeen)[0],
                        lastSeenDT = lastSeenUser?.lastSeen || Date.now(),
                        lastSeenUserID = lastSeenUser?.id || uid,
                        allConvos = chatConvoSelector.selectAll(r),
                        latestConvo = Array.from(allConvos).sort((a,b)=>b.dt - a.dt)[0],
                        sender = latestConvo.sender,
                        dt = latestConvo.dt

                    if (sender===uid && lastSeenUserID !== uid && lastSeenDT > dt) count++

                    const convosFromOthers = allConvos.filter(c=>c.sender !== uid)
                    if (convosFromOthers.length===0) return count > 1

                    const
                        lastConvoFromOthers = Array.from(convosFromOthers).sort((a,b)=>b.dt - a.dt)[0],
                        lastIsRead = lastSeenDT > lastConvoFromOthers.dt
                    
                    const showAsRead = r.markAsRead === 1 ? true : r.markAsRead === -1 ? false : lastIsRead
                    if (!showAsRead) count++

                    return count > 1
                }
            ),[roomID]),
            multiIcons = useAppSelector(state => multiIconsSelector(state)),
            [updateLastSeen] = useUpdateChatLastSeenMutation(),
            router = useRouter(),
            onClick = () => {
                router.push({query:{page:'chat',roomid:roomID}},`/chat/r/${roomID}`,{shallow:true})
                updateLastSeen(roomID)
            }

        return (
            <Grid
                px={1}
                py={1}
                container
                direction='row'
                wrap='nowrap'
                sx={{
                    cursor:'pointer',
                    borderRadius:'10px',
                    '&:hover':{
                        backgroundColor:theme.palette.mode === 'light'
                            ? theme.palette.grey[200]
                            : theme.palette.grey[800],
                        '.MuiBadge-badge':{
                            border:`2px solid ${
                                theme.palette.mode === 'light' 
                                ? theme.palette.grey[200]
                                : theme.palette.grey[800]
                            }`
                        }
                    }
                }}
                onClick={onClick}
            >
                <AvatarLeft roomID={roomID} />
                <Grid
                    container
                    direction='column'
                    sx={{justifyContent:'space-evenly',position:'relative'}}
                >
                    <GroupName roomID={roomID} />
                    <CheckTyping roomID={roomID} />
                </Grid>
                <Grid 
                    container 
                    direction='column' 
                    sx={{
                        justifyContent:multiIcons ? 'space-between' : 'center',
                        width:'auto',
                        ml:1,
                    }}
                >
                    <LastSeenUserAvatar roomID={roomID} />
                    <Pinned roomID={roomID} />
                    <MarkAsRead roomID={roomID} />
                </Grid>
            </Grid>
        )
    }),
    LastSeenUserAvatar = memo(({roomID}:{roomID:EntityId})=>{
        const
            uid = useAppSelector(state => state.misc.uid,shallowEqual),
            theSelector = useMemo(()=>createSelector(
                (state:ReduxState) => state,
                (state:ReduxState) => chatRoomSelector.selectById(state,roomID),
                (state:ReduxState,r:Room) => {
                    const 
                        allConvos = chatConvoSelector.selectAll(r),
                        latestConvo = Array.from(allConvos).sort((a,b)=>b.dt - a.dt)[0],
                        users = chatRoomUserSelector.selectAll(r),
                        lastSeenUser = Array.from(users).sort((a,b)=>b.lastSeen - a.lastSeen)[0],
                        lastSeenUserAvatar = lastSeenUser?.id ? userDetailsSelector.selectById(state,lastSeenUser.id)?.avatar || '' : '',
                        lastSeenDT = lastSeenUser?.lastSeen || Date.now(),
                        pinned = r.pinned,

                        lastSeenUserID = lastSeenUser?.id || state.misc.uid,
                        sender = latestConvo.sender,
                        dt = latestConvo.dt

                    return {
                        pinned,
                        lastSeenUserAvatar,
                        display: sender===uid && lastSeenUserID !== uid && lastSeenDT > dt ? 'flex' : 'none'
                    }
                }
            ),[roomID]),
            {pinned,lastSeenUserAvatar,display} = useAppSelector(state => theSelector(state))

        return (
            <Avatar 
                src={lastSeenUserAvatar} 
                sx={{
                    width: 21, 
                    height: 21,
                    mt:pinned ? 1 : 0,
                    display
                }} 
            />
        )
    }),
    Pinned = memo(({roomID}:{roomID:EntityId})=>{
        const 
            theSelector = useMemo(()=>createSelector(
                (state:ReduxState) => chatRoomSelector.selectById(state,roomID),
                (r:Room) => r.pinned
            ),[roomID]),
            pinned = useAppSelector(state=>theSelector(state))

        return (
            <PushPinRoundedIcon 
                color='primary' 
                sx={{
                    width:21,
                    transform:'rotate(45deg)',
                    display:pinned ? 'block' : 'none',
                }}
            />
        )
    }),
    MarkAsRead = memo(({roomID}:{roomID:EntityId})=>{
        const 
            uid = useAppSelector(state => state.misc.uid,shallowEqual),
            theSelector = useMemo(()=>createSelector(
                (state:ReduxState) => chatRoomSelector.selectById(state,roomID),
                (r:Room) => {
                    const 
                        allConvos = chatConvoSelector.selectAll(r),
                        users = chatRoomUserSelector.selectAll(r),
                        lastSeenUser = Array.from(users).sort((a,b)=>b.lastSeen - a.lastSeen)[0],
                        convosFromOthers = allConvos.filter(c=>c.sender !== uid)

                    if (convosFromOthers.length===0) return 'none'

                    const
                        lastConvoFromOthers = Array.from(convosFromOthers).sort((a,b)=>b.dt - a.dt)[0],
                        lastSeenDT = lastSeenUser.lastSeen,

                        markAsRead = r.markAsRead,
                        lastIsRead = lastSeenDT > lastConvoFromOthers.dt,
                        
                        showAsRead = markAsRead === 1 ? true : markAsRead === -1 ? false : lastIsRead

                    return showAsRead ? 'none' : 'block'
                }
            ),[roomID]),
            display = useAppSelector(state=>theSelector(state))

        return (
            <FiberNewRoundedIcon 
                color='primary' 
                sx={{
                    width:21,
                    display //:sideIconsVisibility[2] ? 'block' : 'none',
                }}
            />
        )
    }),
    AvatarLeft = memo(({roomID}:{roomID:EntityId})=>{
        const
            theme = useTheme(),
            avatar = useAppSelector(state => chatRoomSelector.selectById(state,roomID).avatar),
            {palette:{grey}} = useTheme(),
            badgeDisplaySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (state:ReduxState)=>state.misc.uid,
                (state:ReduxState)=>state,
                (r:Room,uid:EntityId,state:ReduxState)=>{
                    if (!r || r.isGroup) return 0
                    const theOtherUsers = chatRoomUserSelector.selectIds(r).filter(e=>e!==uid)
                    if (!theOtherUsers.length) return 0
                    const theOtherUser = userDetailsSelector.selectById(state,theOtherUsers[0])
                    return !theOtherUser ? 0 : theOtherUser.online ? 1 : 2
                }
            ),[roomID]),
            badgeDisplay = useAppSelector(state => badgeDisplaySelector(state)) // 0 - show no badge, 1 - online, 2 - offline

        return (
            <Badge 
                badgeContent=''
                invisible={false}
                sx={{
                    position:'relative',
                    '.MuiBadge-badge':{
                        backgroundColor:badgeDisplay===1 ? '#44b700' : grey[500],
                        position:'absolute',
                        right:'22px',
                        top:'48px',
                        border:`2px solid ${
                            theme.palette.mode === 'light' 
                                ? theme.palette.grey[100] 
                                : theme.palette.grey[900]
                        }`,
                        display:badgeDisplay===0 ? 'none' : 'flex'
                    }
                }}
            >
                <Avatar src={avatar} sx={{mr:2,width: 56, height: 56}} />
            </Badge>
        )
    }),
    CheckTyping = memo(({roomID}:{roomID:EntityId})=>{
        const
            selector = useMemo(()=>createSelector(
                (state:ReduxState) => state,
                (state:ReduxState) => chatRoomUserSelector.selectAll(chatRoomSelector.selectById(state,roomID)).filter(({typing})=>typing),
                (state:ReduxState,usersTyping:RoomUser[]) => usersTyping.length === 0 
                    ? '' 
                    : `${userDetailsSelector.selectById(state,usersTyping[0].id).firstName} is typing`
            ),[]),
            typing = useAppSelector(state => selector(state),shallowEqual)
        if (!!typing) return <IsTyping text={typing} />
        else return <IsNotTyping roomID={roomID} />
    }),
    IsTyping = memo(({text}:{text:string})=>{
        const 
            ellipsis = useEllipsis(),
            theme = useTheme()

        return (
            <Grid item sx={{display:'grid'}}>
                <Typography 
                    sx={{
                        textOverflow:'ellipsis',
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                        lineHeight:'1rem',
                        fontSize:'0.8rem',
                        color:theme.palette.mode === 'light' ? theme.palette.grey[600] : theme.palette.grey[500],
                        fontStyle:'italic'
                    }}
                >{text} {ellipsis}</Typography>
            </Grid>
        )
    }),
    getInnerText = (e:string) => {
        const 
            parser = new DOMParser(),
            doc = parser.parseFromString(e,'text/html')
        return !!doc.body.childElementCount ? doc.body.innerText : e
    },
    IsNotTyping = memo(({roomID}:{roomID:EntityId})=>{
        const
            selector = useMemo(()=>createSelector(
                (state:ReduxState) => chatConvoSelector.selectAll(chatRoomSelector.selectById(state,roomID)),
                (convos:Convo[]) => {
                    if (convos.length===0) return {
                        dt:0,
                        sender:'',
                        content:''
                    };
                    else {
                        const {dt,sender,content} = convos.length===1 ? convos[0] : Array.from(convos).sort((a,b)=>b.dt - a.dt)[0]
                        return {dt,sender,content:getInnerText(content)}
                    }
                }
            ),[]),
            uid = useAppSelector(state=>state.misc.uid),
            {dt,sender,content} = useAppSelector(state => selector(state)),
            theme = useTheme(),
            spanRef = useRef<HTMLSpanElement>(),
            timeoutRef = useRef<NodeJS.Timeout>(),
            pageVisibility = useAppSelector(state => state.misc.pageVisibility),
            showTime = () => {
                const 
                    diff = Date.now() - dt,
                    toNextTimeout = getClosestNextStepMS(diff)
                spanRef.current.innerText = getTimeInterval(diff)
                timeoutRef.current = setTimeout(showTime,toNextTimeout - (diff % toNextTimeout))
            }

        useEffect(()=>{
            if (!!dt && pageVisibility) showTime()
            return () => clearTimeout(timeoutRef.current)
        },[dt,pageVisibility])

        if (!dt) return <></>

        return (
            <Table
                sx={{
                    '.MuiTableCell-root':{
                        p:0
                    },
                    '.MuiTypography-root':{
                        fontSize:'0.8rem',
                        color:theme.palette.mode === 'light' ? theme.palette.grey[600] : theme.palette.grey[500]
                    },
                }}
            >
                <TableBody>
                    <TableRow sx={{display:'flex'}}>
                        <TableCell 
                            sx={{
                                display:'grid',
                                mr:1,
                                borderBottom:'none'
                            }}
                        >
                            <Typography 
                                sx={{
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                }}
                            >{sender===uid ? 'You: ':''}{content}</Typography>
                        </TableCell>
                        <TableCell sx={{borderBottom:'none'}}>
                            <Typography sx={{width:'max-content'}}><span style={{marginRight:'2px'}}>·</span> <span ref={spanRef}></span></Typography>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
    }),
    GroupName = memo(({roomID}:{roomID:EntityId})=>{
        const
            selector = useMemo(()=>chatRoomSelector.selectById,[]),
            name = useAppSelector(state=>selector(state,roomID).name)

        return (
            <Grid item sx={{display:'grid'}}>
                <Typography 
                    sx={{
                        textOverflow:'ellipsis',
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                    }}
                >{name}</Typography>
            </Grid>
        )
    })

ListTab.displayName = 'ListTab'
IsTyping.displayName = 'IsTyping'
IsNotTyping.displayName = 'IsNotTyping'
AvatarLeft.displayName = 'AvatarLeft'
CheckTyping.displayName = 'CheckTyping'
LastSeenUserAvatar.displayName = 'LastSeenUserAvatar'
Pinned.displayName = 'Pinned'
MarkAsRead.displayName = 'MarkAsRead'
GroupName.displayName = 'GroupName'
export default ListTab