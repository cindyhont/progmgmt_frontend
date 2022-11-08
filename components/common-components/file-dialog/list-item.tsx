import React, { memo, useContext } from 'react'
import Typography from '@mui/material/Typography';
import { getFileSizeString } from '@components/functions';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import { FileDispatchContext } from '.';
import { EntityId } from '@reduxjs/toolkit';
import { deleteAction } from './reducer';

const FileListItem = memo((
    {
        id,
        name,
        size,
        url
    }:{
        id:EntityId;
        name:string;
        size:number;
        url:string;
    }
)=>{
    const 
        {fileDispatch} = useContext(FileDispatchContext),
        onClick = () => {
            URL.revokeObjectURL(url)
            fileDispatch(deleteAction(id))
        }

    return (
        <TableRow>
            <TableCell>
                <Typography sx={{fontSize:'0.9rem',fontWeight:'bold'}}>{name}</Typography>
                <Typography sx={{fontSize:'0.7rem',fontStyle:'italic'}}>{getFileSizeString(size)}</Typography>
            </TableCell>
            <TableCell>
                <IconButton sx={{ml:1,mr:-1}} color='error' onClick={onClick}>
                    <ClearRoundedIcon />
                </IconButton>
            </TableCell>
        </TableRow>
    )
})
FileListItem.displayName = 'FileListItem'
export default FileListItem