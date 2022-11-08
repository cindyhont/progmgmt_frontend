import React, { memo } from "react"
import Grid from "@mui/material/Grid"
import Typography from "@mui/material/Typography"
import Button from '@mui/material/Button'

const ConfirmBeforeRemoveFile = memo((
    {
        fileName,
        backgroundColor,
        onDelete,
        onCancel
    }:{
        fileName:string;
        backgroundColor:string;
        onDelete:()=>void;
        onCancel:()=>void;
    }
)=>(
    <Grid
        container
        direction='column'
        sx={{
            backgroundColor,
            p:1,
            borderRadius:2
        }}
    >
        <Typography sx={{fontSize:'0.8rem',mb:1,wordBreak:'break-word'}}>Confirm to delete <span style={{fontStyle:'italic'}}>{fileName}</span>? Deleted files cannot be recovered.</Typography>
        <Grid
            container
            direction='row'
            sx={{
                justifyContent:'space-evenly'
            }}
        >
            <Button onClick={onCancel}>Cancel</Button>
            <Button onClick={onDelete} color='error' variant='contained'>Delete</Button>
        </Grid>
    </Grid>
))
ConfirmBeforeRemoveFile.displayName = 'ConfirmBeforeRemoveFile'
export default ConfirmBeforeRemoveFile