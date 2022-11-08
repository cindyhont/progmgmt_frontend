import { ReduxState, useAppDispatch, useAppSelector } from '@reducers'
import React, { memo, useCallback, useContext, useEffect, useState } from 'react'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { shallowEqual, useStore } from 'react-redux'
import { chatConvoSelector, chatRoomSelector, updateChatRoomStatus } from '../reducers/slice'
import ReplyRoundedIcon from '@mui/icons-material/ReplyRounded';
import ContentCopyRoundedIcon from '@mui/icons-material/ContentCopyRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { ToggleMenuDialogContext } from '..';
import { closeContextMenuAction, toggleDialogAction } from '../reducers/toggle-context-menu-dialog';
import { useRouter } from 'next/router';

const 
    checkCopy = async () => {
        if (!window.hasOwnProperty('chrome')) return true
        // type it as "notifications" just to skip typescript eslint error
        const [writeRight,readRight] = await Promise.all([
            navigator.permissions.query({ name: "clipboard-write" as "notifications" }),
            navigator.permissions.query({ name: "clipboard-read" as "notifications" }),
        ])
        if (['granted','prompt'].includes(writeRight.state) && ['granted','prompt'].includes(readRight.state)) return true
        else return false
    },
    ConvoOthersContextMenu = memo((
        {
            open,
            anchorPosition
        }:{
            open:boolean;
            anchorPosition:{left:number;top:number;};
        }
    )=>{
        const
            [canAccessClipboard,setCanAccessClipboard] = useState(false),
            ready = useAppSelector(state => !!state.chat.contextMenuID,shallowEqual),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            onClose = useCallback(() => toggleMenuDialogDispatch(closeContextMenuAction('openConvoOthersContextMenu')),[]),
            getAccessRight = async() => {
                const accessRight = await checkCopy()
                setCanAccessClipboard(accessRight)
            }

        useEffect(()=>{
            getAccessRight()
        },[])

        return (
            <Menu 
                open={open}
                onClose={onClose}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition}
                keepMounted
            >
                {ready && <Reply {...{onClose}} />}
                {ready && canAccessClipboard && <Copy {...{onClose}} />}
                {ready && <Forward {...{onClose}} />}
            </Menu>
        )
    }),
    ConvoSelfContextMenu = (
        {
            open,
            anchorPosition
        }:{
            open:boolean;
            anchorPosition:{left:number;top:number;};
        }
    )=>{
        const
            [canAccessClipboard,setCanAccessClipboard] = useState(false),
            ready = useAppSelector(state => !!state.chat.contextMenuID,shallowEqual),
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            onClose = useCallback(() => toggleMenuDialogDispatch(closeContextMenuAction('openConvoSelfContextMenu')),[]),
            getAccessRight = async() => {
                const accessRight = await checkCopy()
                setCanAccessClipboard(accessRight)
            }

        useEffect(()=>{
            getAccessRight()
        },[])

        return (
            <Menu 
                open={open}
                onClose={onClose}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition}
                keepMounted
            >
                {ready && <Reply {...{onClose}} />}
                {ready && <Edit {...{onClose}} />}
                {ready && canAccessClipboard && <Copy {...{onClose}} />}
                {ready && <Forward {...{onClose}} />}
            </Menu>
        )
    },
    Reply = memo((
        {
            onClose,
        }:{
            onClose:()=>void;
        }
    )=>{
        const
            dispatch = useAppDispatch(),
            store = useStore(),
            {query} = useRouter(),
            roomID = query.roomid as string,
            onClick = () => {
                onClose()
                const state = store.getState() as ReduxState
                dispatch(updateChatRoomStatus({
                    id:roomID,
                    changes:{
                        reply:true,
                        replyMsgID:state.chat.contextMenuID,
                        edit:false
                    }
                }))
            }

        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon><ReplyRoundedIcon /></ListItemIcon>
                <ListItemText>Reply</ListItemText>
            </MenuItem>
        )
    }),
    Edit = memo((
        {
            onClose,
        }:{
            onClose:()=>void;
        }
    )=>{
        const
            dispatch = useAppDispatch(),
            store = useStore(),
            {query} = useRouter(),
            roomID = query.roomid as string,
            onClick = () => {
                onClose()
                const state = store.getState() as ReduxState
                dispatch(updateChatRoomStatus({
                    id:roomID,
                    changes:{
                        edit:true,
                        editMsgID:state.chat.contextMenuID,
                        reply:false,
                    }
                }))
            }

        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon><EditRoundedIcon /></ListItemIcon>
                <ListItemText>Edit</ListItemText>
            </MenuItem>
        )
    }),
    Copy = memo((
        {
            onClose,
        }:{
            onClose:()=>void;
        }
    )=>{
        const
            store = useStore(),
            {query} = useRouter(),
            roomID = query.roomid as string,
            onClick = () => {
                onClose()
                const 
                    state = store.getState() as ReduxState,
                    currentRoom = chatRoomSelector.selectById(state,roomID),
                    convo = chatConvoSelector.selectById(currentRoom,state.chat.contextMenuID)
                navigator.clipboard.writeText(convo.content)
            }

        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon><ContentCopyRoundedIcon /></ListItemIcon>
                <ListItemText>Copy Text</ListItemText>
            </MenuItem>
        )
    }),
    Forward = memo((
        {
            onClose,
        }:{
            onClose:()=>void;
        }
    )=>{
        const 
            {toggleMenuDialogDispatch} = useContext(ToggleMenuDialogContext),
            onClick = () => {
                onClose()
                toggleMenuDialogDispatch(toggleDialogAction({key:'openForwardDialog',open:true}))
            }
        return (
            <MenuItem onClick={onClick}>
                <ListItemIcon><ReplyRoundedIcon sx={{transform:'scaleX(-1)'}} /></ListItemIcon>
                <ListItemText>Forward</ListItemText>
            </MenuItem>
        )
    })

Reply.displayName = 'Reply'
Edit.displayName = 'Edit'
Copy.displayName = 'Copy'
Forward.displayName = 'Forward'
ConvoOthersContextMenu.displayName = 'ConvoOthersContextMenu'
export { ConvoOthersContextMenu, ConvoSelfContextMenu }