import { taskSelector } from "@components/tasks/reducers/slice";
import { ReduxState, useAppSelector } from "@reducers";
import React, { memo, SyntheticEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Grid from '@mui/material/Grid';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import { useTheme } from "@mui/material";
import { DialogCtxMenuDispatchContext } from "@components/tasks/contexts";
import { addTaskAction, toggleDialogAction } from "@components/tasks/reducers/dialog-ctxmenu-status";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import FeaturedPlayListOutlinedIcon from '@mui/icons-material/FeaturedPlayListOutlined';
import SwapVertRoundedIcon from '@mui/icons-material/SwapVertRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded';
import ViewColumnRoundedIcon from '@mui/icons-material/ViewColumnRounded';
import { blue } from '@mui/material/colors';
import { useRouter } from "next/router";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import constants from "@components/constants";
import { useStore } from "react-redux";
import TaskDetailsAppBarMenu from "../common/task-details-app-bar-menu";
import { Task } from "@components/tasks/interfaces";

const
    TaskAppBar = () => {
        const 
            router = useRouter(),
            taskID = router.query?.taskid as string,
            taskView = router.query?.view as string,
            taskCountSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectAll(state),
                (state:ReduxState)=>state.misc.uid,
                (tasks:Task[],uid:EntityId)=>{
                    if (!tasks.length) return 0
                    return tasks.filter(t=>{
                        const {isGroupTask,supervisors,owner,participants,viewers,assignee} = t
                        return isGroupTask ? [owner,assignee,...supervisors,...participants,...viewers].includes(uid) : owner===uid
                    }).length
                }
            ),[]),
            taskCount = useAppSelector(state => taskCountSelector(state)),
            checkTaskIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectIds(state),
                (taskIDs:EntityId[])=>!!taskID && taskIDs.includes(taskID)
            ),[taskID]),
            taskIDisValid = useAppSelector(state => checkTaskIdSelector(state))

        useEffect(()=>{
            if (!taskIDisValid && !!taskID) router.push('/tasks')
        },[taskIDisValid])

        if (taskIDisValid) return <TaskDetailsAppBar />
        else if (!!taskCount && !!taskView) return <TaskTabAppBar />
        else return <></>
    },
    TaskDetailsAppBar = () => {
        const 
            router = useRouter(),
            taskID = router.query?.taskid as string,
            nameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID).name,
                (n:string)=>n
            ),[taskID]),
            name = useAppSelector(state => nameSelector(state)),
            store = useStore(),
            crossOnClick = () => {
                const 
                    state = store.getState() as ReduxState,
                    {uid,routerAsPath,routerQuery} = state.misc

                if (!!routerAsPath) {
                    router.push({query:JSON.parse(routerQuery)},routerAsPath,{shallow:true})
                    return
                }

                const
                    view = localStorage.getItem(`${uid}${constants.taskViewLocalStorageKey}`),
                    final = !!view && constants.tasksViews.includes(view) ? view : constants.tasksViews[0]
                    
                router.push({query:{page:'tasks',view:final}},`/tasks/v/${final}`,{shallow:true})
            },
            anchorRef = useRef<HTMLDivElement>(),
            [menuOpen,setMenuOpen] = useState(false),
            titleOnClick = () => setMenuOpen(true),
            menuOnClose = useCallback(() => setMenuOpen(false),[])
        
        return (
            <>
            <Grid sx={{ flexGrow: 1 }} container direction='row' ref={anchorRef}>
                <Typography
                    component="h1"
                    variant="h6"
                    color="inherit"
                    noWrap
                    sx={{lineHeight:2}}
                >{name}</Typography>
                <IconButton sx={{ml:2,p:0.5}} onClick={titleOnClick}>
                    <ExpandMoreRoundedIcon fontSize="large" htmlColor='#fff' />
                </IconButton>
            </Grid>
            <IconButton sx={{ml:1}} onClick={crossOnClick}>
                <CloseRoundedIcon fontSize='large' htmlColor='#fff' />
            </IconButton>
            <TaskDetailsAppBarMenu {...{
                anchor:anchorRef.current,
                open:menuOpen,
                onClose:menuOnClose
            }} />
            </>
        )
    },
    TaskTabAppBar = () => {
        const 
            tabValues = useRef(constants.tasksViews).current,
            router = useRouter(),
            taskView = router.query.view as string,
            handleChange = (_: SyntheticEvent, e: number) => {
                router.push(`/?page=tasks&view=${tabValues[e]}`,`/tasks/v/${tabValues[e]}`,{shallow:true})
            },
            {palette:{mode}} = useTheme()

        return (
            <Grid
                container
                direction='row'
                sx={{
                    justifyContent:'space-between'
                }}
            >
                <Tabs 
                    value={constants.tasksViews.indexOf(taskView)}
                    variant="scrollable"
                    scrollButtons="auto"
                    onChange={handleChange}
                    sx={{
                        ...(mode==='light' && {
                            '.MuiTabs-indicator':{
                                backgroundColor:'#fff'
                            },
                            '.MuiTab-root':{
                                color:`${blue[100]} !important`,
                            },
                        }),
                        '.Mui-selected':{
                            fontWeight:'bold',
                            letterSpacing:'0.05rem',
                            ...(mode==='light' && {
                                color:'#fff !important',
                            })
                        },
                    }}
                >
                    <Tab label='List' />
                    <Tab label='Board' />
                </Tabs>
                <Stack 
                    direction='row'
                    spacing={1}
                    sx={{
                        '.MuiButton-iconSizeMedium':{
                            mr:0.5
                        },
                        '.MuiButtonBase-root':{
                            height:35,
                            fontSize:'0.7rem',
                            p:1,
                            ...(mode==='light' && {color:'#fff'})
                        },
                        '.MuiSvgIcon-root':{
                            fontSize:'0.8rem',
                            ...(mode==='light' && {fill:'#fff'})
                        }
                    }}
                >
                    {taskView===constants.tasksViews[0] && <>
                    {/*<ListFilterButton />
                    <ListSortButton />*/}
                    </>}
                    <FieldButton />
                    <AddButton {...{tab:constants.tasksViews.indexOf(taskView)}} />
                </Stack>
            </Grid>
        )
    },
    ListFilterButton = memo(()=>{
        return (
            <Box 
                sx={{
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'center',
                }}
            >
                <Button
                    startIcon={<FilterListRoundedIcon />}
                    // onClick={onClick}
                >Filter</Button>
            </Box>
        )
    }),
    ListSortButton = memo(()=>{
        return (
            <Box 
                sx={{
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'center',
                }}
            >
                <Button
                    startIcon={<SwapVertRoundedIcon />}
                    // onClick={onClick}
                >Sort</Button>
            </Box>
        )
    }),
    FieldButton = memo(()=>{
        const 
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'editListViewColumns',open:true}))

        return (
            <Box 
                sx={{
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'center',
                }}
            >
                <Button
                    startIcon={<FeaturedPlayListOutlinedIcon />}
                    onClick={onClick}
                >Fields</Button>
            </Box>
        )
    }),
    AddButton = memo(({tab}:{tab:number;})=>{
        const 
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            anchorRef = useRef<HTMLButtonElement>(),
            [menuOpen,setMenuOpen] = useState(false),
            onMenuClose = () => setMenuOpen(false),
            btnOnClick = () => setMenuOpen(true),
            openDialog = (dialogKey:'addTask'|'addCustomField'|'addBoardColumn') => () => {
                setMenuOpen(false)
                if (dialogKey==='addTask') dialogCtxMenuStatusDispatch(addTaskAction({}))
                else dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:dialogKey,open:true}))
            }

        return (
            <Box 
                sx={{
                    display:'flex',
                    flexDirection:'column',
                    justifyContent:'center',
                }}
            >
                <Button
                    ref={anchorRef}
                    startIcon={<AddRoundedIcon />}
                    onClick={btnOnClick}
                >Add</Button>
                <Menu
                    open={menuOpen}
                    onClose={onMenuClose}
                    anchorEl={anchorRef.current}
                >
                    <MenuItem onClick={openDialog('addTask')}>
                        <ListItemIcon>
                            <AssignmentTurnedInRoundedIcon />
                        </ListItemIcon>
                        <ListItemText>Task</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={openDialog('addCustomField')}>
                        <ListItemIcon>
                            <FeaturedPlayListOutlinedIcon />
                        </ListItemIcon>
                        <ListItemText>Custom Field</ListItemText>
                    </MenuItem>
                    <MenuItem sx={{display:tab===1 ? 'flex' : 'none'}} onClick={openDialog('addBoardColumn')}>
                        <ListItemIcon>
                            <ViewColumnRoundedIcon />
                        </ListItemIcon>
                        <ListItemText>Board Column</ListItemText>
                    </MenuItem>
                </Menu>
            </Box>
        )
    })
ListFilterButton.displayName = 'ListFilterButton'
ListSortButton.displayName = 'ListSortButton'
FieldButton.displayName = 'FieldButton'
AddButton.displayName = 'AddButton'
export default TaskAppBar