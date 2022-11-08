import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import React, { memo, useCallback, useContext, useEffect, useMemo, useRef, useState, MouseEvent } from 'react';
import { taskFieldSelector, taskSelector, updateCtxMenuIDs } from './reducers/slice';
import StartUpAddTask from './startup-add-task';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import ListView from './list';
import { addTaskAction, openCtxMenuAction, toggleDialogAction } from './reducers/dialog-ctxmenu-status';
import BoardView from './board';
import TaskDetails from './task-details';
import { DialogCtxMenuDispatchContext } from './contexts';
import { useRouter } from 'next/router';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import constants from '@components/constants';
import { useStore } from 'react-redux';
import SmallScreenToggle from '@components/common-components/small-screen-toggle';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { Task } from './interfaces';
import { updateSession } from '@components/functions';

const 
    TaskPageContent = memo(()=>{
        const 
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
            router = useRouter(),
            taskID = router.query?.taskid as string,
            taskView = router.query?.view as string,
            checkTaskIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (state:ReduxState)=>state.misc.uid,
                (t:Task,uid:EntityId)=>{
                    if (!t) return false
                    const 
                        allRights = [...t.supervisors,t.owner],
                        arr = t.isGroupTask ? [...allRights,...t.participants,...t.viewers,t.assignee] : allRights
                    return arr.includes(uid)
                }
            ),[taskID]),
            taskIDisValid = useAppSelector(state => checkTaskIdSelector(state)),
            store = useStore(),
            dispatch = useAppDispatch(),
            toTaskView = () => {
                if (!taskCount) {
                    router.push(`/?page=tasks`,`/tasks`,{shallow:true})
                    return
                }
                if (!!taskView && constants.tasksViews.includes(taskView)) return
                
                const 
                    state = store.getState() as ReduxState,
                    uid = state.misc.uid,
                    view = localStorage.getItem(`${uid}${constants.taskViewLocalStorageKey}`)
                if (!!view && constants.tasksViews.includes(view)) router.push(`/?page=tasks&view=${view}`,`/tasks/v/${view}`,{shallow:true})
                else router.push(`/?page=tasks&view=${constants.tasksViews[0]}`,`/tasks/v/${constants.tasksViews[0]}`,{shallow:true})
            }

        useEffect(()=>{
            if (!taskIDisValid && (!taskView || !constants.tasksViews.includes(taskView))) toTaskView()
        },[taskIDisValid,taskView])

        useEffect(()=>{
            if (constants.tasksViews.includes(taskView)) {
                const 
                    state = store.getState() as ReduxState,
                    uid = state.misc.uid
                localStorage.setItem(`${uid}${constants.taskViewLocalStorageKey}`,taskView)
                updateSession(router,dispatch)
            }
        },[taskView])

        if (!taskCount) return <StartUpAddTask />
        else if (taskIDisValid) return <TaskDetails />
        else if (constants.tasksViews.includes(taskView)) return <TaskLayouts />
        else return <></>
    }),
    TaskLayouts = memo(()=>{
        const
            taskViews = useRef(constants.tasksViews).current,
            {query} = useRouter(),
            taskView = query.view as string,
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
            [speedDialOn,setSpeedDialOn] = useState(false),
            updateSpeedDial = useCallback((e:boolean)=>setSpeedDialOn(e),[]),
            toggleSpeedDial = useCallback(()=>setSpeedDialOn(!speedDialOn),[speedDialOn]),
            speedDialAnchor = useRef<HTMLButtonElement>()

        return (
            <>
            <Grid container spacing={3}>
                <Grid item xs={12}>
                    <Grid 
                        container 
                        onContextMenu={onContextMenu}
                    >
                        {taskViews.map(e=>(
                            <Box 
                                key={e}
                                sx={{
                                    display:e===taskView ? 'block' : 'none',
                                    width:'100%',
                                    ...(e==='list' && {overflowX:'scroll'})
                                }}
                            >
                                {e==='list' && <ListView />}
                                {e==='board' && <BoardView />}
                            </Box>
                        ))}
                    </Grid>
                </Grid>
            </Grid>
            <SmallScreenToggle onClick={toggleSpeedDial} ref={speedDialAnchor}>
                <AddRoundedIcon 
                    sx={{
                        transform:`rotate(${speedDialOn ? 45 : 0}deg)`,
                        transition:'transform 0.2s ease'
                    }}
                />
            </SmallScreenToggle>
            <SmallScreenToggleMenu {...{
                anchor:speedDialAnchor.current,
                open:speedDialOn,
                onClose:()=>updateSpeedDial(false)
            }} />
            </>
        )
    }),
    SmallScreenToggleMenu = memo((
        {
            anchor,
            open,
            onClose,
        }:{
            anchor:HTMLElement;
            open:boolean;
            onClose:()=>void;
        }
    )=>{
        const 
            {query} = useRouter(),
            taskView = query.view as string,
            store = useStore(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            addTask = () => {
                onClose()
                if (taskView==='list') dialogCtxMenuStatusDispatch(addTaskAction({}))
                else if (taskView==='board'){
                    const 
                        state = store.getState() as ReduxState,
                        currentColumn = state.taskMgmt.boardViewSmallScreenColumn,
                        boardColumnFieldID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').id
                    dialogCtxMenuStatusDispatch(addTaskAction({[boardColumnFieldID]:currentColumn}))
                }
            },
            addCustomField = () => {
                onClose()
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'addCustomField',open:true}))
            },
            rearrangeListColumns = () => {
                onClose()
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'editListViewColumns',open:true}))
            },
            addBoardColumn = () => {
                onClose()
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'addBoardColumn',open:true}))
            }

        return (
            <Menu
                open={open}
                onClose={onClose}
                anchorEl={anchor}
                keepMounted
            >
                <MenuItem onClick={addTask}>Add Task</MenuItem>
                <MenuItem onClick={addCustomField}>Add Custom Field</MenuItem>
                {taskView==='list' && <MenuItem onClick={rearrangeListColumns}>Rearrange Columns</MenuItem>}
                {taskView==='board' && <MenuItem onClick={addBoardColumn}>Add Column</MenuItem>}
            </Menu>
        )
    })

TaskPageContent.displayName = 'TaskPageContent'
TaskLayouts.displayName = 'TaskLayouts'
SmallScreenToggleMenu.displayName = 'SmallScreenToggleMenu'
export default TaskPageContent