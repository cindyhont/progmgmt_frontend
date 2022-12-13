import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

const BlankMessage = ({text}:{text:string}) => (
    <Box sx={{py:3}}>
        <Typography textAlign='center' sx={{textTransform:'uppercase',fontSize:'0.9rem',fontWeight:'bold'}}>{text}</Typography>
    </Box>
)

export default BlankMessage