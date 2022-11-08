import React, { useEffect } from "react";
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery'
import TasksByStatus from "./tasks-by-status";
import { useStore } from "react-redux";
import { googleChartIsLoaded } from "@reducers/misc";
import AssignedToMe from "./assigned-to-me";


const 
    Dashboard = () => {
        const
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            {breakpoints:{up}} = useTheme(),
            matchesSM = useMediaQuery(up('sm')),
            matchesMD = useMediaQuery(up('md')),
            store = useStore(),
            dispatch = useAppDispatch(),
            updateChartLoaded = () => dispatch(googleChartIsLoaded())

        useEffect(()=>{
            const {googleChartLoaded} = (store.getState() as ReduxState).misc
            if (!googleChartLoaded){
                google.charts.load("current", {packages:["corechart",'bar']});
                google.charts.setOnLoadCallback(updateChartLoaded)
            }
        },[])

        if (matchesMD || matchesSM && !sidebarOpen) return (
            <Stack direction='row' spacing={2} p={2}>
                <DashboardColumn>
                    <>
                    <TasksByStatus />
                    </>
                </DashboardColumn>
                <DashboardColumn>
                    <>
                    <AssignedToMe />
                    </>
                </DashboardColumn>
            </Stack>
        )
            
        return (
            <Grid p={2} sx={{minHeight:'calc(100vh - 64px)'}}>
                <DashboardColumn>
                    <>
                    <TasksByStatus />
                    <AssignedToMe />
                    </>
                </DashboardColumn>
            </Grid>
        )
    },
    DashboardColumn = ({children}:{children:JSX.Element}) => (
        <Stack
            sx={{width:'100%'}}
            direction='column'
            spacing={2}
        >{children}</Stack>
    )

export default Dashboard