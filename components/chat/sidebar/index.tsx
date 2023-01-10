import React, { memo } from 'react'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableContainer from '@mui/material/TableContainer';
import { useTheme } from '@mui/material/styles';
import SearchBox from './searchbox';
import ChatroomContainer from './chatroom-container';
import SpeedDial from './speed-dial';

const 
    SideBar = memo(()=>{
        const {palette:{mode,grey}} = useTheme()
        return (
            <TableContainer 
                sx={{
                    maxHeight:'calc(var(--viewport-height) - 95px)',
                    overflowY:'scroll',
                }}
            >
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                sx={{
                                    backgroundColor: grey[mode==='light' ? 100 : 900],
                                    borderBottom:'none',
                                    pt:0,
                                    pb:1
                                }}
                            >
                                <SearchBox />
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <ChatroomContainer />
                    </TableBody>
                </Table>
                <SpeedDial />
            </TableContainer>
        )
    })

SideBar.displayName = 'SideBar'
export default SideBar