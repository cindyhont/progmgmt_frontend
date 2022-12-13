import React, { memo } from 'react'
import TableCell from '@mui/material/TableCell';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import IconButton from '@mui/material/IconButton'
import { grey } from '@mui/material/colors';

const EditModeToggle = memo(({onClick}:{onClick:()=>void;}) => (
    <TableCell sx={{width:0}}>
        <IconButton onClick={onClick}>
            <EditRoundedIcon fontSize="small" htmlColor={grey[500]} />
        </IconButton>
    </TableCell>
))
EditModeToggle.displayName = 'EditModeToggle'
export default EditModeToggle