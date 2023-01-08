import React, { useEffect } from "react";
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import { ReduxState, useAppDispatch } from "@reducers";
import TasksByStatus from "./tasks-by-status";
import { useStore } from "react-redux";
import { googleChartIsLoaded } from "@reducers/misc";
import AssignedToMe from "./assigned-to-me";
import useNarrowBody from "hooks/theme/narrow-body";
import WysiwygPreload from "@components/common-components/wysiwyg-preload";


const 
    Dashboard = () => {
        const
            store = useStore(),
            dispatch = useAppDispatch(),
            narrowBody = useNarrowBody(),
            updateChartLoaded = () => dispatch(googleChartIsLoaded())

        useEffect(()=>{
            const {googleChartLoaded} = (store.getState() as ReduxState).misc
            if (!googleChartLoaded){
                google.charts.load("current", {packages:["corechart",'bar']});
                google.charts.setOnLoadCallback(updateChartLoaded)
            }
        },[])

        if (!narrowBody) return (
            <Stack direction='row' spacing={2} p={2}>
                <WysiwygPreload />
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
                <WysiwygPreload />
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