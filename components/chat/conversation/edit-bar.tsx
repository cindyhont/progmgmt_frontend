import React, { ForwardedRef, forwardRef, memo, useMemo } from "react";
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Typography from "@mui/material/Typography";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { useStore } from "react-redux";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { chatConvoSelector, chatRoomSelector, updateChatRoomStatus } from "../reducers/slice";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { Room } from "../interfaces";
import { useRouter } from "next/router";

const EditBar = memo(forwardRef((_,ref:ForwardedRef<HTMLDivElement>)=>{
    const
        theme = useTheme(),
        dispatch = useAppDispatch(),
        store = useStore(),
        {query} = useRouter(),
        roomID = query.roomid as string,
        editStatusSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID).editMsgID,
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID).edit,
            (editMsgID:string,editStatus:boolean)=> !!editMsgID && !!editStatus
        ),[roomID]),
        editStatus = useAppSelector(state => !!roomID && editStatusSelector(state)),
        editContentSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID),
            (state:ReduxState)=>chatRoomSelector.selectById(state,roomID).editMsgID,
            (r:Room,id:EntityId)=>{
                const editConvo = chatConvoSelector.selectById(r,id)
                if (!editConvo) return ''
                const 
                    parser = new DOMParser(),
                    doc = parser.parseFromString(editConvo.content,'text/html')

                if (doc.body.childElementCount===0) return editConvo.content
                return doc.body.innerText
            }
        ),[roomID]),
        content = useAppSelector(state => !!roomID && editContentSelector(state)),
        msgOnClick = () => {
            const 
                state = store.getState() as ReduxState,
                editMsgID = chatRoomSelector.selectById(state,roomID).editMsgID,
                containerElem = document.getElementById(`${editMsgID}`)
            containerElem.scrollIntoView({behavior:'smooth'})
        },
        closeOnClick = () => dispatch(updateChatRoomStatus({id:roomID,changes:{edit:false}}))

    return (
        <Grid ref={ref} sx={{display:'block',opacity:editStatus ? '1' : '0',transition:'all 0.2s'}}>
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
                            <EditRoundedIcon color='disabled' />
                        </TableCell>
                        <TableCell
                            sx={{
                                display:'grid',
                                my:0.5,
                                py:0.5,
                                px:2,
                                borderRadius:3,
                                cursor:editStatus ? 'pointer' : 'default',
                                pointerEvents: editStatus ? 'auto' : 'none',
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
                            >Edit message:</Typography>
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
                                onClick={closeOnClick}
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
}))

EditBar.displayName = 'EditBar'
export default EditBar