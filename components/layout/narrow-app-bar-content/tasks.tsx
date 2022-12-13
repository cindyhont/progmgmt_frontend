import { taskFieldSelector, taskSelector, updateBoardViewSmallScreenColumn } from "@components/tasks/reducers/slice";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { useRouter } from "next/router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import constants from "@components/constants";
import { capitalizeSingleWord } from "@components/functions";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import { useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery'
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { useStore } from "react-redux";
import TaskDetailsAppBarMenu from "../common/task-details-app-bar-menu";
import Collapse from '@mui/material/Collapse';
import { Task } from "@components/tasks/interfaces";

export interface IboardColumnOption {
    id:EntityId;
    name:string;
    order:number;
}

const 
    TaskAppBar = () => {
        const 
            {query} = useRouter(),
            taskID = query?.taskid as string,
            taskView = query?.view as string,
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

        if (taskIDisValid) return <TaskDetailsAppBar />
        else if (!!taskCount && !!taskView) return <TaskViewSelect />
        else return <></>
    },
    TaskViewSelect = () => {
        const
            router = useRouter(),
            taskView = router.query.view as string,
            boardColumnOptionSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as IboardColumnOption[],
                (columns:IboardColumnOption[])=>{
                    const len = columns.length
                    if (!len) return []
                    else if (len===1) {
                        const {id,name} = columns[0]
                        return [{id,name}]
                    } else return Array.from(columns)
                        .sort((a,b)=>a.order - b.order)
                        .map(({id,name})=>({id,name}))
                }
            ),[]),
            boardColumnNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.boardViewSmallScreenColumn,
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as IboardColumnOption[],
                (columnID:EntityId,options:IboardColumnOption[])=>{
                    if (!columnID) return ''
                    const column = options.find(e=>e.id===columnID)
                    return !!column ? column.name : ''
                }
            ),[]),
            boardColumnName = useAppSelector(state => boardColumnNameSelector(state)),
            options = useAppSelector(state => boardColumnOptionSelector(state)),
            [mainMenuOpen,setMainMenuOpen] = useState(false),
            [boardMenuOpen,setBoardMenuOpen] = useState(false),
            mainMenuOnClose = () => {
                setMainMenuOpen(false)
                setTimeout(()=>setBoardMenuOpen(false),200)
            },
            mainMenuOnOpen = () => setMainMenuOpen(true),
            anchor = useRef<HTMLButtonElement>(),
            store = useStore(),
            dispatch = useAppDispatch(),
            moveToTaskView = (e:string) => () => {
                if (e==='list'){
                    mainMenuOnClose()
                    if (taskView !== e) router.push(`/?page=tasks&view=${e}`,`/tasks/v/${e}`,{shallow:true})
                } else setBoardMenuOpen(prev => !prev)
            },
            moveToBoardColumn = (e:EntityId) => () => {
                const 
                    state = store.getState() as ReduxState,
                    uid = state.misc.uid,
                    key = `${uid}${constants.taskBoardViewSmallScreenColumnKey}`
                dispatch(updateBoardViewSmallScreenColumn(e))
                localStorage.setItem(key,e.toString())
                if (taskView !== 'board') router.push(`/?page=tasks&view=board`,`/tasks/v/board`,{shallow:true})
                mainMenuOnClose()
            }

        useEffect(()=>{
            const 
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                key = `${uid}${constants.taskBoardViewSmallScreenColumnKey}`
            let boardViewSmallScreenColumn = state.taskMgmt.boardViewSmallScreenColumn
            if (!boardViewSmallScreenColumn){
                const column = localStorage.getItem(key)
                if (!!column && options.findIndex(e=>e.id===column)!==-1) boardViewSmallScreenColumn = column
                else {
                    const defaultColumnID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.default as EntityId
                    boardViewSmallScreenColumn = defaultColumnID
                }
                if (!!boardViewSmallScreenColumn) {
                    dispatch(updateBoardViewSmallScreenColumn(boardViewSmallScreenColumn))
                    localStorage.setItem(key,boardViewSmallScreenColumn.toString())
                }
            }
        },[])

        /*
        useEffect(()=>{
            if (taskView==='list') setButtonTitle('List View')
            else if (taskView==='board') {
                const 
                    state = store.getState() as ReduxState,
                    uid = state.misc.uid,
                    key = `${uid}${constants.taskBoardViewSmallScreenColumnKey}`
                let boardViewSmallScreenColumn = state.taskMgmt.boardViewSmallScreenColumn
                if (!boardViewSmallScreenColumn){
                    const column = localStorage.getItem(key)
                    if (!!column && options.findIndex(e=>e.id===column)!==-1) boardViewSmallScreenColumn = column
                    else {
                        const defaultColumnID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.default as EntityId
                        boardViewSmallScreenColumn = defaultColumnID
                    }
                }
                const initialColumn = options.find(e=>e.id===boardViewSmallScreenColumn)
                if (!!initialColumn) {
                    setButtonTitle(initialColumn.name)
                    localStorage.setItem(key,initialColumn.id.toString())
                }
            }
        },[])
        */
            
        return (
            <>
            <Button 
                sx={{color:'#fff'}} 
                endIcon={<ExpandMoreRoundedIcon />}
                onClick={mainMenuOnOpen}
                ref={anchor}
            >{taskView==='list' ? 'List View' : boardColumnName}</Button>
            <Menu
                open={mainMenuOpen}
                onClose={mainMenuOnClose}
                anchorEl={anchor.current}
                keepMounted
            >
                {constants.tasksViews.map(e=>(
                    <MenuItem 
                        key={e} 
                        sx={{position:'relative',minWidth:200}}
                        onClick={moveToTaskView(e)}
                    >{capitalizeSingleWord(e)} View {e==='board' && <ExpandMoreRoundedIcon sx={{position:'absolute',right:8}} />}</MenuItem>
                ))}
                <Collapse timeout='auto' in={boardMenuOpen}>
                    {options.map(({id,name})=>(
                        <MenuItem 
                            key={id} 
                            sx={{pl:4,minWidth:200}}
                            onClick={moveToBoardColumn(id)}
                        >{name.repeat(1)}</MenuItem>
                    ))}
                </Collapse>
            </Menu>
            </>
        )
    },
    /*
    TaskViewSelect = () => {
        const 
            value = useAppSelector(state => state.taskMgmt.boardViewSmallScreenColumn),
            dispatch = useAppDispatch(),
            onChange = (e:SelectChangeEvent) => dispatch(updateBoardViewSmallScreenColumn(e.target.value)),
            boardColumnOptionSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as IboardColumnOption[],
                (columns:IboardColumnOption[])=>{
                    const len = columns.length
                    if (!len) return []
                    else if (len===1) {
                        const {id,name} = columns[0]
                        return [{id,name}]
                    } else return Array.from(columns)
                        .sort((a,b)=>a.order - b.order)
                        .map(({id,name})=>({id,name}))
                }
            ),[]),
            options = useAppSelector(state => boardColumnOptionSelector(state)),
            store = useStore()

        useEffect(()=>{
            const 
                state = store.getState() as ReduxState,
                uid = state.misc.uid,
                key = `${uid}${constants.taskBoardViewSmallScreenColumnKey}`
            if (!!value){
                localStorage.setItem(key,value.toString())
            } else {
                const column = localStorage.getItem(key)
                if (!!column && options.findIndex(e=>e.id===column)!==-1) dispatch(updateBoardViewSmallScreenColumn(column))
                else {
                    const defaultColumnID = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.default as EntityId
                    dispatch(updateBoardViewSmallScreenColumn(defaultColumnID))
                }
            }
        },[value])

        return (
            <>
            {!!value && <FormControl 
                variant="standard" 
                sx={{
                    '.MuiInputBase-root':{
                        '& *':{color:'#fff'},
                        '&:before':{display:'none'}
                    },
                    ml:1
                }}
            >
                <Select value={value} onChange={onChange}>
                    {options.map(({id,name})=>(
                        <MenuItem value={id} key={id}>{name}</MenuItem>
                    ))}
                </Select>
            </FormControl>}
            </>
        )
    },*/
    TaskDetailsAppBar = () => {
        const 
            router = useRouter(),
            taskID = router.query?.taskid as string,
            nameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID).name,
                (n:string)=>n
            ),[taskID]),
            name = useAppSelector(state => nameSelector(state)),
            {breakpoints:{up}} = useTheme(),
            matchesMD = useMediaQuery(up('sm')),
            store = useStore(),
            closeOnClick = () => {
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
            anchor = useRef<HTMLButtonElement>(),
            [menuOpen,setMenuOpen] = useState(false),
            menuOnOpen = () => setMenuOpen(true),
            menuOnClose = useCallback(() => setMenuOpen(false),[])

        return (
            <>
            <Table
                sx={{
                    '.MuiTableCell-root':{
                        p:0,
                        border:'none'
                    },
                    mr:-1,
                }}
            >
                <TableBody>
                    <TableRow>
                        <TableCell>
                            <Button 
                                endIcon={<ExpandMoreRoundedIcon htmlColor="#fff" />} 
                                sx={{maxWidth:'calc(100% - 36px)',justifyContent:'flex-start'}}
                                ref={anchor}
                                onClick={menuOnOpen}
                            >
                                <Box sx={{display:'grid'}}>
                                    <Typography
                                        component='span'
                                        sx={{
                                            color:'#fff',
                                            fontSize:'1rem',
                                            textOverflow:'ellipsis',
                                            overflow: 'hidden', 
                                            whiteSpace: 'nowrap',
                                        }}
                                    >{name}</Typography>
                                </Box>
                            </Button>
                        </TableCell>
                        <TableCell sx={{right:8,top:matchesMD ? 12 : 8,position:'absolute'}}>
                            <IconButton onClick={closeOnClick}>
                                <ClearRoundedIcon htmlColor="#fff" />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <TaskDetailsAppBarMenu {...{
                anchor:anchor.current,
                open:menuOpen,
                onClose:menuOnClose
            }} />
            </>
        )
    }

export default TaskAppBar