import React, { memo } from 'react'
import TableCell from "@mui/material/TableCell";
import Typography from '@mui/material/Typography';
import { grey } from '@mui/material/colors';

const SimpleTextDisplay = memo((
    {
        content,
        nilTextColor
    }:{
        content:string;
        nilTextColor:boolean
    }
) => (
    <TableCell sx={{width:'100%'}}>
        <Typography
            sx={{...(nilTextColor && {color:grey[500]}),py:1}}
        >{content}</Typography>
    </TableCell>
))
SimpleTextDisplay.displayName = 'SimpleTextDisplay'
export default SimpleTextDisplay