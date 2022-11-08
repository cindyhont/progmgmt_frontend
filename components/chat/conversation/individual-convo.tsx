import { ReduxState, useAppSelector } from "@reducers";
import React, { memo, useMemo } from "react";
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import { blue } from '@mui/material/colors';
import ErrorOutlineOutlinedIcon from '@mui/icons-material/ErrorOutlineOutlined';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { chatConvoSelector, chatRoomSelector, chatRoomUserSelector } from "../reducers/slice";
import { Convo, Room } from "../interfaces";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { FileDivertComponent, FileDownload } from "@components/common-components";
import { useRouter } from "next/router";
import Box from '@mui/material/Box'

const 
    showDateTime = (edited:number,original:number) => {
        const originalDate = new Date(original)
        if (edited===0) return originalDate.toLocaleTimeString('en',{hour:'numeric',minute:'2-digit',hour12:false})

        const 
            originalDateStr = originalDate.toDateString(),
            editEditDate = new Date(edited),
            editedDateStr = editEditDate.toDateString()

        if (originalDateStr === editedDateStr) return `edited ${editEditDate.toLocaleTimeString('en',{hour:'numeric',minute:'2-digit',hour12:false})}`
        return `edited ${editEditDate.toLocaleDateString('en',{
            month:'short',
            day:'numeric',
            ...(originalDate.getFullYear() !== editEditDate.getFullYear() && {year:'numeric'})
        })}, ${editEditDate.toLocaleTimeString('en',{hour:'numeric',minute:'2-digit',hour12:false})}`
    },
    IndividualConvo = memo(({id}:{id:EntityId})=>{
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            uid = useAppSelector(state => state.misc.uid),
            {sent,sender} = useAppSelector(state=>chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id))

        return (
            <Box sx={{display:'contents'}}>
                {!!sender ? sender===uid ? sent ? <ConvoFromSelf {...{id}} /> : <ConvoFileUploading {...{id}} /> : <ConvoFromOthers {...{id}} /> : <></>}
            </Box>
        )
    }),
    selectState = (state:ReduxState)=>state,
    getPrevSelector = (id:EntityId,roomID:string) => createSelector(
        (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
        (r:Room)=>{
            const
                convos = chatConvoSelector.selectAll(r),
                thisConvo = chatConvoSelector.selectById(r,id),
                {sender} = thisConvo,
                prevConvos = convos.filter(c => c.dt < thisConvo.dt)
            if (prevConvos.length===0) return false
            const prevConvo = prevConvos.sort((a,b)=>b.dt - a.dt)[0]
            return prevConvo.sender === sender && new Date(prevConvo.dt).toDateString() === new Date(thisConvo.dt).toDateString()
        }
    ),
    getNextSelector = (id:EntityId,roomID:string) => createSelector(
        (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
        (r:Room)=>{
            const
                convos = chatConvoSelector.selectAll(r),
                thisConvo = chatConvoSelector.selectById(r,id),
                {sender} = thisConvo,
                nextConvos = convos.filter(c => c.dt > thisConvo.dt)
            if (nextConvos.length===0) return false
            const nextConvo = nextConvos.sort((a,b)=>a.dt - b.dt)[0]
            return nextConvo.sender === sender && new Date(nextConvo.dt).toDateString() === new Date(thisConvo.dt).toDateString()
        }
    ),
    ConvoFromOthers = (
        {
            id,
        }:{
            id:EntityId;
        }
    ) => {
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            avatarSelector = useMemo(()=>createSelector(
                selectState,
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (state:ReduxState,r:Room)=>{
                    const sender = chatConvoSelector.selectById(r,id).sender
                    return userDetailsSelector.selectById(state,sender).avatar
                }
            ),[id,roomID]),
            avatar = useAppSelector(state => avatarSelector(state)),
            initialSelector = useMemo(()=>createSelector(
                selectState,
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (state:ReduxState,r:Room)=>{
                    const 
                        sender = chatConvoSelector.selectById(r,id).sender,
                        senderDetails = userDetailsSelector.selectById(state,sender)
                    return `${senderDetails.firstName[0]}${senderDetails.lastName[0]}`.toUpperCase()
                }
            ),[id,roomID]),
            initial = useAppSelector(state => initialSelector(state)),
            fileIDsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
                (r:Room)=>chatConvoSelector.selectById(r,id).fileIDs
            ),[id,roomID]),
            fileIDs = useAppSelector(state => fileIDsSelector(state)),
            prevSelector = useMemo(()=>getPrevSelector(id,roomID),[id,roomID]),
            nextSelector = useMemo(()=>getNextSelector(id,roomID),[id,roomID]),
            prevIsSameSender = useAppSelector(state => prevSelector(state)),
            nextIsSameSender = useAppSelector(state => nextSelector(state)),
            {palette:{grey,mode}} = useTheme()

        return (
            <Grid 
                container 
                direction='row'
                flexWrap='nowrap'
                id={`${id}`}
                data-convootherid={id}
                sx={{
                    maxWidth:'70%',
                    ...(fileIDs.length !== 0 && {
                        minWidth:'50%',
                        width:'auto',
                    }),
                    justifyContent:'flex-start',
                    my:0.25
                }}
            >
                <Grid 
                    container 
                    direction='column' 
                    sx={{
                        justifyContent:'flex-end',
                        width:'auto',
                        visibility:nextIsSameSender ? 'hidden' : 'visible'
                    }}
                >
                    <Avatar src={avatar} sx={{ width: 40, height: 40, fontSize:'0.9rem' }}>{initial}</Avatar>
                </Grid>
                <Grid
                    container
                    direction='column'
                    sx={{
                        backgroundColor:grey[mode==='light' ? 300 : 800],
                        justifyContent:'center',
                        width:'auto',
                        py:1,
                        px:1,
                        mx:1,
                        borderTopRightRadius:20,
                        borderBottomRightRadius:20,
                        borderTopLeftRadius: prevIsSameSender ? 5 : 20,
                        borderBottomLeftRadius: nextIsSameSender ? 5 : 20,
                    }}
                >
                    {fileIDs.length !== 0 && <Stack spacing={1} sx={{mb:0.5}}>
                        {fileIDs.map(id=>(
                            <FileDownload key={id} {...{id,inChat:true}} />
                        ))}
                    </Stack>}
                    <Reply {...{id}} />
                    <Content {...{id}} />
                </Grid>
            </Grid>
        )
    },
    ConvoFileUploading = ({id}:{id:EntityId}) => {
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            prevSelector = useMemo(()=>getPrevSelector(id,roomID),[id,roomID]),
            nextSelector = useMemo(()=>getNextSelector(id,roomID),[id,roomID]),
            prevIsSameSender = useAppSelector(state => prevSelector(state)),
            nextIsSameSender = useAppSelector(state => nextSelector(state)),
            error = useAppSelector(state => chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id).error),
            fileIDs = useAppSelector(state => chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id).fileIDs)
        
        return (
            <Grid 
                container 
                direction='row'
                flexWrap='nowrap'
                sx={{
                    justifyContent:'flex-end',
                    my:0.25
                }}
                id={`${id}`}
                data-convoselfid={id}
            >
                <SelfMessageContainer {...{
                    hasFiles:fileIDs.length !== 0,
                    prevIsSameSender,
                    nextIsSameSender
                }}>
                    <>
                    {fileIDs.length !== 0 && <Stack spacing={1} sx={{mb:0.5}}>
                        {fileIDs.map(id=>(
                            <FileDivertComponent {...{id,inChat:true}} key={id} />
                        ))}
                    </Stack>}
                    <Grid
                        container
                        direction='row'
                    >
                        <Reply {...{id}} />
                        <Content {...{id}} />
                        {error && <ErrorMark />}
                    </Grid>
                    </>
                </SelfMessageContainer>
                <SmallAvatar {...{
                    visibility:'hidden',
                    avatar:'',
                    avatarInitial:''
                }} />
            </Grid>
        )
    },
    ConvoFromSelf = ({id}:{id:EntityId}) => {
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            prevSelector = useMemo(()=>getPrevSelector(id,roomID),[id,roomID]),
            nextSelector = useMemo(()=>getNextSelector(id,roomID),[id,roomID]),
            prevIsSameSender = useAppSelector(state => prevSelector(state)),
            nextIsSameSender = useAppSelector(state => nextSelector(state)),
            error = useAppSelector(state => chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id).error),
            fileIDs = useAppSelector(state => chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id).fileIDs),
            selectFirstReadUserDetails = (state:ReduxState,roomID:string,id:EntityId)=>{
                const
                    r = chatRoomSelector.selectById(state,roomID),
                    convos = chatConvoSelector.selectAll(r),
                    thisConvo = chatConvoSelector.selectById(r,id),
                    uid = state.misc.uid,
                    users = Array.from(chatRoomUserSelector.selectAll(r)).filter(u=>{
                        if (u.lastSeen < thisConvo.dt || convos.length===0 || u.id===uid) return false
        
                        const convosRead = convos.filter(c=>c.dt < u.lastSeen && c.sender === uid)
                        if (convosRead.length === 0) return false
                        
                        return convosRead.sort((a,b)=>b.dt - a.dt)[0].id === id
                    })
                return users.length === 0 ? null : userDetailsSelector.selectById(state,users[0].id)
            },
            avatarSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const firstUser = selectFirstReadUserDetails(state,roomID,id)
                    return !!firstUser ? firstUser.avatar : ''
                }
            ),[roomID,id]),
            avatar = useAppSelector(state => avatarSelector(state)),
            avatarInitialSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const firstUser = selectFirstReadUserDetails(state,roomID,id)
                    return !!firstUser ? `${firstUser.firstName[0]}${firstUser.lastName[0]}`.toUpperCase() : ''
                }
            ),[id,roomID]),
            avatarInitial = useAppSelector(state => avatarInitialSelector(state)),
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const firstUser = selectFirstReadUserDetails(state,roomID,id)
                    return !!firstUser ? 'visible' : 'hidden'
                }
            ),[id,roomID]),
            visibility = useAppSelector(state => visibilitySelector(state))

        return (
            <Grid 
                container 
                direction='row'
                flexWrap='nowrap'
                sx={{
                    justifyContent:'flex-end',
                    my:0.25,
                }}
                id={`${id}`}
                data-convoselfid={id}
                // ref={ref}
            >
                <SelfMessageContainer {...{
                    hasFiles:fileIDs.length !== 0,
                    prevIsSameSender,
                    nextIsSameSender
                }}>
                    <>
                    {fileIDs.length !== 0 && <Stack spacing={1} sx={{mb:0.5}}>
                        {fileIDs.map(id=>(
                            <FileDivertComponent key={id} {...{id,inChat:true}} />
                        ))}
                    </Stack>}
                    <Grid
                        container
                        direction='row'
                    >
                        <Reply {...{id}} />
                        <Content {...{id}} />
                        {error && <ErrorMark />}
                    </Grid>
                    </>
                </SelfMessageContainer>
                <SmallAvatar {...{
                    visibility,
                    avatar,
                    avatarInitial
                }} />
            </Grid>
        )
    },
    ErrorMark = memo(()=>(
        <Grid 
            container 
            direction='column'
            sx={{
                width:'auto',
                justifyContent:'center',
            }}
            ml={1}
        >
            <Tooltip title='Not delivered'>
                <ErrorOutlineOutlinedIcon 
                    sx={{
                        width:'15px',
                        height:'15px'
                    }}
                    color='disabled'
                />
            </Tooltip>
        </Grid>
    )),
    Content = memo((
        {
            id,
        }:{
            id:EntityId;
        }
    )=>{
        const 
            theme = useTheme(),
            {query} = useRouter(),
            roomID = query.roomid as string,
            contentSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id),
                (convo:Convo)=>{
                    const 
                        content = convo.content,
                        date = showDateTime(convo.editDt,convo.dt),
                        parser = new DOMParser(),
                        doc = parser.parseFromString(content,'text/html')

                    if (doc.body.childElementCount===0) {
                        const 
                            div = document.createElement('div'),
                            p = document.createElement('p'),
                            span = document.createElement('span')

                        p.innerText = content
                        span.innerText = date
                        span.classList.add('convo-date')
                        p.appendChild(span)
                        div.appendChild(p)
                        return div.innerHTML
                    }
                    
                    const lastChild = doc.body.lastChild as HTMLElement

                    if (lastChild.tagName.toLowerCase() === 'p'){
                        const span = document.createElement('span')
                        span.classList.add('convo-date')
                        span.innerText = date
                        lastChild.appendChild(span)
                    } else {
                        lastChild.style.marginBottom = '0px'
                        const 
                            p = document.createElement('p'),
                            span = document.createElement('span')

                        span.classList.add('convo-date')
                        span.innerText = date
                        p.style.marginTop = '0px'
                        p.appendChild(span)
                        lastChild.appendChild(p)
                    }

                    return doc.body.innerHTML
                }
            ),[roomID]),
            content = useAppSelector(state => contentSelector(state)),
            {palette:{text}} = useTheme()

        return (
            <Typography 
                dangerouslySetInnerHTML={{__html:content}} 
                sx={{
                    width:'fit-content',
                    px:1,
                    '& > :first-of-type':{
                        mt:0
                    },
                    '& > :last-of-type':{
                        mb:0
                    },
                    '& a':{
                        color:text.primary,
                    },
                    '& span.convo-date':{
                        fontSize:'0.8rem',
                        color:theme.palette.mode === 'light' ? theme.palette.grey[600] : theme.palette.grey[400],
                        float:'right',
                        lineHeight:'1.5rem',
                        verticalAlign:'bottom',
                        marginLeft:'8px',
                    }
                }}
            />
        )
    }),
    Reply = memo((
        {
            id,
        }:{
            id:EntityId;
        }
    )=>{
        const 
            theme = useTheme(),
            {query} = useRouter(),
            roomID = query.roomid as string,
            {replyMsgID,replyMsgSender:replyMsgSenderID} = useAppSelector(state => chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),id)),
            replyMsgSender = useAppSelector(state => userDetailsSelector.selectById(state,replyMsgSenderID)),
            replySrcInListSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    if (!roomID || !replyMsgID) return false
                    const
                        room = chatRoomSelector.selectById(state,roomID),
                        allConvoIDs = chatConvoSelector.selectIds(room)
                    return allConvoIDs.includes(replyMsgID)
                }
            ),[replyMsgID,roomID]),
            replySrcInList = useAppSelector(state => replySrcInListSelector(state)),
            replyMsgSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const
                        room = chatRoomSelector.selectById(state,roomID),
                        replyConvo = chatConvoSelector.selectById(room,replyMsgID),
                        content = replyConvo?.content

                    if (!content) return ''

                    const
                        parser = new DOMParser(),
                        doc = parser.parseFromString(content,'text/html')

                    if (doc.body.childElementCount===0) return content
                    return doc.body.innerText
                }
            ),[replyMsgID,roomID]),
            replyMsg = useAppSelector(state => replyMsgSelector(state)),
            onClick = () => {
                if (!replyMsgID || !replySrcInList) return
                const elem = document.getElementById(replyMsgID.toString())
                elem.scrollIntoView({behavior:'smooth',block:'nearest'})
            }

        return (
            <Grid
                container
                direction='column'
                onClick={onClick}
                sx={{
                    backgroundColor:`rgba(${theme.palette.mode==='light' ? '255,255,255' : '0,0,0'},0.2)`,
                    borderRadius:2,
                    px:1,
                    py:0.5,
                    display:!!replyMsgSender ? 'grid' : 'none',
                    cursor:replySrcInList ? 'pointer' : 'default'
                }}
            >
                <Typography
                    sx={{
                        width:'fit-content',
                        fontSize:'0.8rem',
                        textOverflow:'ellipsis',
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                    }}
                >{!!replyMsgSender ? `${replyMsgSender.firstName} ${replyMsgSender.lastName}`.trim() : ''}:</Typography>
                <Typography
                    sx={{
                        width:'fit-content',
                        fontSize:'0.8rem',
                        textOverflow:'ellipsis',
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                    }}
                >{replyMsg}</Typography>
            </Grid>
        )
    }),
    SmallAvatar = memo((
        {
            visibility,
            avatar,
            avatarInitial,
        }:{
            visibility:string;
            avatar:string;
            avatarInitial:string;
        }
    )=>(
        <Grid 
            container 
            direction='column' 
            sx={{
                justifyContent:'flex-end',
                width:'auto',
                visibility
            }}
        >
            <Avatar 
                src={avatar}
                sx={{ width: 20, height: 20, fontSize:'0.6rem' }} 
            >{avatarInitial}</Avatar>
        </Grid>
    )),
    SelfMessageContainer = memo((
        {
            hasFiles,
            prevIsSameSender,
            nextIsSameSender,
            children,
        }:{
            hasFiles:boolean;
            prevIsSameSender:boolean;
            nextIsSameSender:boolean;
            children:JSX.Element;
        }
    )=>{
        const theme = useTheme()
        return (
            <Grid
                container
                direction='column'
                sx={{
                    maxWidth:'70%',
                    ...(hasFiles && {
                        minWidth:'50%',
                        width:'auto',
                    }),
                    backgroundColor:theme.palette.mode==='dark' ? blue[800] : blue[100],
                    justifyContent:'center',
                    width:'auto',
                    p:1,
                    mx:1,
                    borderTopLeftRadius:20,
                    borderBottomLeftRadius:20,
                    borderTopRightRadius: prevIsSameSender ? 5 : 20,
                    borderBottomRightRadius: nextIsSameSender ? 5 : 20,
                }}
            >{children}</Grid>
        )
    })

IndividualConvo.displayName = 'IndividualConvo'
ErrorMark.displayName = 'ErrorMark'
Content.displayName = 'Content'
Reply.displayName = 'Reply'
SmallAvatar.displayName = 'SmallAvatar'
SelfMessageContainer.displayName = 'SelfMessageContainer'
export default IndividualConvo