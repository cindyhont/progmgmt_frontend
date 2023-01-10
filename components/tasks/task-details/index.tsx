import React, { MouseEvent, useCallback, useContext, useEffect, useState } from "react";
import Grid from '@mui/material/Grid'
import { useAppDispatch, useAppSelector } from "@reducers";
import { updateCtxMenuIDs } from "../reducers/slice";
import { DialogCtxMenuDispatchContext } from "../contexts";
import { openCtxMenuAction } from "../reducers/dialog-ctxmenu-status";
import Sidebar from "./sidebar";
import Body from "./body";
import { useTheme } from '@mui/material/styles';
import WidgetsRoundedIcon from '@mui/icons-material/WidgetsRounded';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import SmallScreenToggle from "@components/common-components/small-screen-toggle";
import useNarrowBody from "hooks/theme/narrow-body";

const 
    TaskDetails = () => {
        const 
            theme = useTheme(),
            {palette:{mode,grey}} = theme,
            narrowBody = useNarrowBody(),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            dispatch = useAppDispatch(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onContextMenu = (e:MouseEvent<HTMLDivElement>) => {
                const 
                    paths = e.nativeEvent.composedPath() as HTMLElement[],
                    count = paths.length,
                    coord = {
                        left:e.clientX,
                        top:e.clientY
                    }

                for (let i=0; i<count; i++){
                    const {dataset} = paths[i]
                    if (!dataset || Object.keys(dataset).length===0) continue
                    if (dataset.field==='name' && !dataset.taskid) return

                    if (!!dataset.field || !!dataset.taskid || !!dataset.boardcolumnid || !!dataset.fileid){
                        e.preventDefault()
                        dispatch(updateCtxMenuIDs(JSON.parse(JSON.stringify(dataset))))
                        dialogCtxMenuStatusDispatch(openCtxMenuAction(coord))
                        break
                    }
                }
            },
            [rightSidebarOpen,setRightSidebarOpen] = useState(false),
            toggleOnClick = useCallback(()=>setRightSidebarOpen(prev=>!prev),[rightSidebarOpen])

        useEffect(()=>{
            const sidebar = document.getElementById('task-details-sidebar')
            if (narrowBody){
                if (rightSidebarOpen) sidebar.style.left = '0%'
                else sidebar.style.left = '100%'
            } else {
                setRightSidebarOpen(false)
                sidebar.style.left = null
            }
        },[rightSidebarOpen,narrowBody])

        return (
            <Grid
                {...{
                    ...(!narrowBody ? {
                        container:true,
                        direction:'row',
                        spacing:2,
                        p:0,
                        pt:2,
                        onContextMenu
                    } : {
                        sx:{
                            position:'relative',
                            overflowX:'hidden'
                        }
                    }),
                }}
            >
                <Grid
                    {...{
                        ...(narrowBody ? {
                            item:true,
                            sx:{
                                ml:2,
                                pr:2,
                                pt:2,
                                height:`calc(var(--viewport-height) - 64px)`,
                                overflow:'auto',
                            }
                            
                        } : {
                            item:true,
                            xs:false,
                            sm:sidebarOpen ? false : 8,
                            md:sidebarOpen ? 8 : 9,
                            lg:9,
                            sx:{
                                height:`calc(var(--viewport-height) - 64px)`,
                                overflow:'auto',
                                pr:2,
                                ml:2,
                                mr:-2,
                            }
                        })
                    }}
                >
                    <Body />
                </Grid>
                <Grid
                    id='task-details-sidebar'
                    {...{
                        ...(narrowBody ? {
                            item:true,
                            px:2,
                            sx:{
                                position:'absolute',
                                pt:2,
                                zIndex:3,
                                top:0,
                                left:'100%',
                                width:'100%',
                                backgroundColor:grey[mode==='light' ? 100 : 900],
                                height:`calc(var(--viewport-height) - 64px)`,
                                overflow:'auto',
                                transition:'left 0.3s'
                            }
                        } : {
                            item:true,
                            xs:false,
                            sm:sidebarOpen ? false : 4,
                            md:sidebarOpen ? 4 : 3,
                            lg:3,
                            sx:{
                                height:`calc(var(--viewport-height) - 64px)`,
                                overflow:'auto',
                                pr:2
                            }
                        })
                    }}
                >
                    <Sidebar />
                </Grid>
                <SmallScreenToggle onClick={toggleOnClick}>
                    {rightSidebarOpen ? <ClearRoundedIcon /> : <WidgetsRoundedIcon />}
                </SmallScreenToggle>
            </Grid>
        )
    }

export default TaskDetails