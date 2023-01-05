import React, { ForwardedRef, forwardRef, memo, useState } from 'react';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import MoodRoundedIcon from '@mui/icons-material/MoodRounded';
import WYSIWHYeditor from './wysiwyg-editor';
import FileButton from './file-button';
import Table from '@mui/material/Table';
import SubmitBtn from './submit-btn';

const ChatInput = memo(forwardRef((_,ref:ForwardedRef<HTMLDivElement>)=>{
    const 
        {palette:{grey}} = useTheme(),
        [noInputString,setNoInputString] = useState(true)
    
    return (
        <>
        <Box
            sx={{
                borderRadius:5,
                border:`1px solid ${grey[500]}`,
                ml:'1px'
            }}
            ref={ref}
        >
            <Table
                sx={{
                    '.MuiTableCell-root':{
                        p:0,
                        border:'none',
                        fontSize:'1rem',
                        '&:not(:nth-of-type(2))':{width:34,position:'relative'}
                    }
                }}
            >
                <TableBody>
                    <TableRow>
                        <TableCell>
                            <IconButton 
                                size='small' 
                                id='chat-emoji-btn'
                                sx={{
                                    position:'absolute',
                                    bottom:'0px',
                                }}
                            >
                                <MoodRoundedIcon />
                            </IconButton>
                        </TableCell>
                        <TableCell>
                            <WYSIWHYeditor {...{setNoInputString}} />
                        </TableCell>
                        <TableCell>
                            <FileButton />
                        </TableCell>
                        <TableCell>
                            <SubmitBtn {...{noInputString}} />
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </Box>
        </>
    )
}))

ChatInput.displayName = 'ChatInput'
export default ChatInput