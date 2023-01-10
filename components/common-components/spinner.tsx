import React from "react";
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';

const Spinner = (
    {
        show,
        height,
    }:{
        show:boolean;
        height:string;
    }
) => (
    <Grid
        container
        direction='column'
        sx={{
            height,
            display:show ? 'flex' : 'none',
            justifyContent:'center',
        }}
    >
        <Grid
            container
            direction='row'
            sx={{justifyContent:'center'}}
        >
            <CircularProgress />
        </Grid>
    </Grid>
)

export default Spinner