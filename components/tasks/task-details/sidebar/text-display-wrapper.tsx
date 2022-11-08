import React, { memo } from 'react'
import Box from '@mui/material/Box'
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";

const TextDisplayWrapper = memo(({editMode,children}:{editMode:boolean;children:JSX.Element;})=>(
    <Box
        sx={{
            mb:editMode ? 1 : 0.5,
            ...(!editMode && {
                ml:1.5,
                mr:0.5,
            })
        }}
    >
        <Table
            sx={{
                '.MuiTableCell-root':{
                    border:'none',
                    p:0,
                },
            }}
        >
            <TableBody>{children}</TableBody>
        </Table>
    </Box>
))
TextDisplayWrapper.displayName = 'TextDisplayWrapper'
export default TextDisplayWrapper