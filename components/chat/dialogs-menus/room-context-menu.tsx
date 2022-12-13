import React, { memo, useEffect, useState, useMemo, useContext } from "react";
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import { useTheme } from '@mui/material/styles';
import { ReduxState, useAppSelector } from "@reducers";
import { useUpdateChatPinnedMutation, useUpdateChatMarkAsReadMutation } from "../reducers/api";
import MarkChatReadOutlinedIcon from '@mui/icons-material/MarkChatReadOutlined';
import MarkChatUnreadOutlinedIcon from '@mui/icons-material/MarkChatUnreadOutlined';
import GroupRemoveRoundedIcon from '@mui/icons-material/GroupRemoveRounded';
import { chatConvoSelector, chatRoomSelector, chatRoomUserSelector } from "../reducers/slice";
import { createSelector } from "@reduxjs/toolkit";
import { ToggleMenuDialogContext } from "..";
import { closeContextMenuAction } from "../reducers/toggle-context-menu-dialog";
import { Room } from '../interfaces'
import { useStore } from "react-redux";

const 
    RoomContextMenu = memo((
        {
            open,
            anchorPosition
        }:{
            open:boolean;
            anchorPosition:{left:number;top:number;};
        }
    ) => {
        const 
            ready = useAppSelector(state => !!state.chat.contextMenuID),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            onClose = () => toggleMenuDialogDispatch(closeContextMenuAction('openRoomContextMenu'))

        return (
            <Menu 
                open={open}
                onClose={onClose}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition}
                keepMounted
            >
                {ready && <PinToTop />}
                {ready && <MarkAsRead />}
                {ready && <LeaveGroup />}
            </Menu>
        )
    }),
    PinToTop = memo(()=>{
        const
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            pinnedSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,state.chat.contextMenuID),
                (r:Room)=>!!r ? r.pinned : false
            ),[]),
            pinned = useAppSelector(state => pinnedSelector(state)),
            [updatePinned] = useUpdateChatPinnedMutation(),
            store = useStore(),
            onClick = () => {
                toggleMenuDialogDispatch(closeContextMenuAction('openRoomContextMenu'))
                setTimeout(()=>updatePinned({rid:(store.getState() as ReduxState).chat.contextMenuID,pinned:!pinned}),100)
            }

        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon><PushPinOutlinedIcon /></ListItemIcon>
                <ListItemText>{`${pinned ? 'Unpin from' : 'Pin to'} top`}</ListItemText>
            </MenuItem>
        )
    }),
    MarkAsRead = memo(()=>{
        const
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            markAsReadSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,state.chat.contextMenuID),
                (r:Room)=>!!r ? r.markAsRead : false
            ),[]),
            markAsRead = useAppSelector(state => markAsReadSelector(state)),
            lastIsReadSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const 
                        uid = state.misc.uid,
                        room = chatRoomSelector.selectById(state,state.chat.contextMenuID)
                    if (!room) return false
                    const roomUser = chatRoomUserSelector.selectById(room,uid)
                    if (!roomUser) return false
                    const
                        lastSeen = roomUser.lastSeen,
                        convos = chatConvoSelector.selectAll(room),
                        convosFromOthers = convos.filter(c=>c.sender !== uid)
                    if (convosFromOthers.length===0) return true
                    const lastConvo = convosFromOthers.sort((a,b)=>b.dt - a.dt)[0]
                    return lastSeen >= lastConvo.dt
                }
            ),[]),
            lastIsRead = useAppSelector(state => lastIsReadSelector(state)),
            [isRead,setIsRead] = useState(true),
            [updateMarkAsRead] = useUpdateChatMarkAsReadMutation(),
            store = useStore(),
            onClick = () => {
                toggleMenuDialogDispatch(closeContextMenuAction('openRoomContextMenu'))
                updateMarkAsRead({rid:(store.getState() as ReduxState).chat.contextMenuID,markAsRead:isRead ? -1 : 1})
            }

        useEffect(()=>{
            if (markAsRead === 1) setIsRead(true)
            else if (markAsRead === -1) setIsRead(false)
            else setIsRead(lastIsRead)
        },[markAsRead,lastIsRead])

        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon>{lastIsRead ? <MarkChatUnreadOutlinedIcon /> : <MarkChatReadOutlinedIcon />}</ListItemIcon>
                <ListItemText>{`Mark as ${isRead ? 'un' : ''}read`}</ListItemText>
            </MenuItem>
        )
    }),
    LeaveGroup = memo(()=>{
        const
            theme = useTheme(),
            isGroupSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>chatRoomSelector.selectById(state,state.chat.contextMenuID),
                (r:Room)=>!!r ? r.isGroup : false
            ),[]),
            isGroup = useAppSelector(state => isGroupSelector(state))

        return (
            <MenuItem sx={{display:isGroup ? 'flex' : 'none'}}>
                <ListItemIcon><GroupRemoveRoundedIcon color='error' /></ListItemIcon>
                <ListItemText sx={{color:theme.palette.error.main}}>Leave Group</ListItemText>
            </MenuItem>
        )
    })

PinToTop.displayName = 'PinToTop'
MarkAsRead.displayName = 'MarkAsRead'
LeaveGroup.displayName = 'LeaveGroup'
RoomContextMenu.displayName = 'RoomContextMenu'
export default RoomContextMenu