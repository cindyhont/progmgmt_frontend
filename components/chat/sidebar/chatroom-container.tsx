import { ReduxState, useAppSelector } from "@reducers";
import React, { useMemo } from "react";
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import ListTab from "./list-tab";
import { chatConvoSelector, chatRoomSelector } from "../reducers/slice";
import { createSelector } from "@reduxjs/toolkit";
import { Room } from "../interfaces";

const ChatroomContainer = () => {
    const 
        newIDsSelector = useMemo(()=>createSelector(
            (state:ReduxState) => chatRoomSelector.selectAll(state),
            (rooms:Room[])=>{
                const roomIDwLatestMsgDate = rooms.map(r=>{
                    const convos = chatConvoSelector.selectAll(r)
                    if (convos.length===0) return {dt:0,id:r.id,pinned:r.pinned}
                    return {dt:Math.max(...convos.map(c=>c.dt)),id:r.id,pinned:r.pinned}
                })
                return roomIDwLatestMsgDate.filter(e=>!!e.dt).sort((a,b)=>a.pinned===b.pinned ? (b.dt - a.dt) : b.pinned ? 1 : -1).map(({id,dt})=>({id,dt}))
            }
        ),[]),
        idsWithDt = useAppSelector(state=>newIDsSelector(state))

    return (
        <>
        {idsWithDt.map(({id,dt}) => (
            <TableRow key={id} sx={{display:!!dt ? 'table-row' : 'none'}}>
                <TableCell sx={{borderBottom:'none',py:0}} data-roomid={id}>
                    <ListTab roomID={id} />
                </TableCell>
            </TableRow>
        ))}
        </>
    )
}

export default ChatroomContainer;