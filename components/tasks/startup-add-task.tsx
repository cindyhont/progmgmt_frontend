import React, { memo, useContext } from "react";
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { addTaskAction } from "./reducers/dialog-ctxmenu-status";
import { DialogCtxMenuDispatchContext } from "./contexts";

const StartUpAddTask = memo(()=>{
    const 
        {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
        onClick = () => dialogCtxMenuStatusDispatch(addTaskAction({}))

    return (
        <Grid
            container
            direction='column'
            sx={{
                height:'calc(var(--viewport-height) - 95px)',
                justifyContent:'center',
                pb:'100px'
            }}
        >
            <Grid
                container
                direction='row'
                sx={{
                    justifyContent:'center'
                }}
            >
                <Grid>
                    <Typography sx={{mb:2}}>{`Wow it's pretty empty here.`}</Typography>
                    <Button variant='contained' color='primary' onClick={onClick}>Add your first task</Button>
                </Grid>
            </Grid>
        </Grid>
    )
})

StartUpAddTask.displayName = 'StartUpAddTask'
export default StartUpAddTask