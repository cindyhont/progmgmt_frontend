import React, { ForwardedRef, forwardRef, memo, useContext, useEffect, useMemo, useRef } from "react";
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Typography from "@mui/material/Typography";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import ReplyOutlinedIcon from '@mui/icons-material/ReplyOutlined';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { chatConvoSelector, chatRoomSelector, updateChatRoomStatus } from "../reducers/slice";
import { createSelector } from "@reduxjs/toolkit";
import { useStore } from "react-redux";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { useRouter } from "next/router";
import { Room } from "../interfaces";
import { ChatEventStateContext } from "./functions/reducer-context";

const ReplyBar = memo(()=>{
    const
        theme = useTheme(),
        dispatch = useAppDispatch(),
        store = useStore(),
        container = useRef<HTMLDivElement>(),
        {query} = useRouter(),
        roomID = query.roomid as string,
        {editorLoaded} = useContext(ChatEventStateContext),
        replyStatusSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (r:Room)=>!!r && r.reply
        ),[roomID]),
        replyStatus = useAppSelector(state => replyStatusSelector(state)),
        contentSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (state:ReduxState,room:Room)=>{
                if (!room) return '|'
                const replyMsgID = room.replyMsgID
                if (!replyMsgID) return '|'
                const 
                    parser = new DOMParser(),
                    content = chatConvoSelector.selectById(chatRoomSelector.selectById(state,roomID),replyMsgID).content,
                    doc = parser.parseFromString(content,'text/html')
                if (doc.body.childElementCount===0) return content
                return doc.body.innerText
            }
        ),[roomID]),
        content = useAppSelector(state => contentSelector(state)),
        senderNameSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state,
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (state:ReduxState,room:Room)=>{
                if (!room) return '|'

                const replyMsgID = room.replyMsgID
                if (!replyMsgID) return '|'
                const
                    replyConvo = chatConvoSelector.selectById(room,replyMsgID),
                    senderID = replyConvo.sender,
                    uid = state.misc.uid;
                if (!senderID) return 'Unknown staff member'
                if (senderID===uid) return 'You'
                const sender = userDetailsSelector.selectById(state,senderID)
                return `${sender.firstName} ${sender.lastName}`.trim()
            }
        ),[roomID]),
        senderName = useAppSelector(state => senderNameSelector(state)),
        msgOnClick = () => {
            const 
                state = store.getState() as ReduxState,
                replyMsgID = chatRoomSelector.selectById(state,roomID).replyMsgID,
                containerElem = document.getElementById(`${replyMsgID}`)
            if (!!containerElem) containerElem.scrollIntoView({behavior:'smooth'})
        },
        cancelOnClick = () => dispatch(updateChatRoomStatus({id:roomID,changes:{reply:false}}))

    useEffect(()=>{
        container.current.style.height = replyStatus && editorLoaded ? `${container.current.scrollHeight}px` : '0px'
    },[replyStatus && editorLoaded])

    return (
        <Grid 
            ref={container} 
            id='chat-reply-bar' 
            sx={{
                display:'block',
                opacity:replyStatus ? '1' : '0',
                transition:'all 0.2s',
            }}
        >
            <Table
                sx={{
                    borderRadius:1000,
                    backgroundColor:theme.palette.background.paper,
                }}
            >
                <TableBody>
                    <TableRow
                        sx={{
                            '.MuiTableCell-root':{
                                border:'none'
                            }
                        }}
                    >
                        <TableCell
                            sx={{
                                width:0,
                                p:1,
                                pl:2,
                            }}
                        >
                            <ReplyOutlinedIcon color='disabled' />
                        </TableCell>
                        <TableCell
                            sx={{
                                display:'grid',
                                my:0.5,
                                py:0.5,
                                px:2,
                                borderRadius:3,
                                cursor:replyStatus ? 'pointer' : 'default',
                                pointerEvents: replyStatus ? 'auto' : 'none',
                                '&:hover':{
                                    backgroundColor:theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900]
                                }
                            }}
                            onClick={msgOnClick}
                        >
                            <Typography
                                sx={{
                                    fontSize:'0.8rem',
                                    lineHeight:'1rem',
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                    color:theme.palette.text.secondary
                                }}
                            >{senderName}:</Typography>
                            <Typography
                                sx={{
                                    fontSize:'0.8rem',
                                    lineHeight:'1rem',
                                    textOverflow:'ellipsis',
                                    overflow: 'hidden', 
                                    whiteSpace: 'nowrap',
                                    color:theme.palette.text.secondary
                                }}
                            >{content}</Typography>
                        </TableCell>
                        <TableCell
                            sx={{
                                width:0,
                                py:0,
                                px:1
                            }}
                        >
                            <IconButton
                                sx={{
                                    '&:hover .MuiSvgIcon-root':{
                                        fill:theme.palette.text.primary
                                    }
                                }}
                                onClick={cancelOnClick}
                            >
                                <CloseRoundedIcon 
                                    sx={{
                                        fill:theme.palette.text.secondary
                                    }}
                                />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Grid>
    )
})

ReplyBar.displayName = 'ReplyBar'
export default ReplyBar