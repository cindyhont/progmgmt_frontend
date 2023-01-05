import React, { ForwardedRef, forwardRef, memo } from "react";
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableContainer from '@mui/material/TableContainer';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Box from '@mui/material/Box'
import { useAppSelector } from "@reducers";
import { chatRoomSelector } from "../reducers/slice";
import { EntityId } from "@reduxjs/toolkit";
import IconButton from '@mui/material/IconButton'
import ArrowBackIosNewRoundedIcon from '@mui/icons-material/ArrowBackIosNewRounded';
import { userDetailsSelector } from "@reducers/user-details/slice";
import { useRouter } from "next/router";
import useNarrowBody from "hooks/theme/narrow-body";

const 
    Header = memo(()=>{
        const 
            {query} = useRouter(),
            roomID = query.roomid as string,
            userID = query.userid as string

        return (
            <TableContainer sx={{overflow:'initial'}}>
                {!!roomID && <RoomHeader roomID={roomID} />}
                {!!userID && <UserHeader userID={userID} />}
            </TableContainer>
        )
    }),
    RoomHeader = memo(({roomID}:{roomID:EntityId})=>{
        const 
            avatar = useAppSelector(state => chatRoomSelector.selectById(state,roomID)?.avatar || ''),
            name = useAppSelector(state => chatRoomSelector.selectById(state,roomID)?.name || '')

        return <HeaderContent {...{avatar,name}} />
    }),
    UserHeader = memo(({userID}:{userID:string})=>{
        const {avatar,firstName,lastName} = useAppSelector(state => userDetailsSelector.selectById(state,userID))

        return <HeaderContent {...{avatar,name:`${firstName} ${lastName}`.trim()}} />
    }),
    HeaderContent = (
        {
            name,
            avatar
        }:{
            name:string;
            avatar:string;
        }
    ) => {
        const
            router = useRouter(),
            narrowBody = useNarrowBody(),
            backOnClick = () => router.push('/?page=chat','/chat',{shallow:true})

        return (
            <Table
                sx={{
                    '.MuiTableCell-root':{
                        borderBottom:'none',
                        pb:1
                    },
                    ...(narrowBody && {ml:1}),
                }}
            >
                <TableBody>
                    <TableRow>
                        {narrowBody && <TableCell sx={{textAlign:'left',p:0,width:0}}>
                            <IconButton 
                                sx={{ml:-1}} 
                                onClick={backOnClick}
                                disableRipple
                            >
                                <ArrowBackIosNewRoundedIcon />
                            </IconButton>
                        </TableCell>}
                        <TableCell sx={{p:0,m:0,width:0}}>
                            <Avatar src={avatar} sx={{margin:'2px'}} />
                        </TableCell>
                        <TableCell
                            sx={{
                                p:0,
                                pl:1,
                            }}
                        >
                            <Box sx={{display:'grid'}}>
                                <Typography 
                                    sx={{
                                        width:'auto',
                                        fontWeight:'600',
                                        textOverflow:'ellipsis',
                                        overflow: 'hidden', 
                                        whiteSpace: 'nowrap',
                                    }}
                                >{name.repeat(1)}</Typography>
                            </Box>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        )
    }

Header.displayName = 'Header'
RoomHeader.displayName = 'RoomHeader'
UserHeader.displayName = 'UserHeader'
export default Header