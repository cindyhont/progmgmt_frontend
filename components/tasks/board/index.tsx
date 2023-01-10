import React, { createContext, Dispatch, memo, useContext, useMemo, useReducer, useEffect, useRef } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Stack from '@mui/material/Stack';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { taskFieldSelector, taskSelector } from "../reducers/slice";
import { useStore } from "react-redux";
import { useTheme } from "@mui/material";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { addTaskAction } from "../reducers/dialog-ctxmenu-status";
import { columnStartMoving, Iaction, init, initialState, moving, reducer } from "./reducer";
import taskApi, { useTaskMovedInBoardMutation } from "../reducers/api";
import { DialogCtxMenuDispatchContext } from "../contexts";
import TaskItem from "./task-item";
import useNarrowBody from "hooks/theme/narrow-body";
import useFuncWithTimeout from "hooks/counter/function-with-timeout";

export interface Ioption {
    id:EntityId;
    name:string;
    order:number;
}

const 
    BoardViewDispatchContext = createContext<{boardViewDispatch:Dispatch<Iaction>}>({boardViewDispatch:()=>{}}),
    BoardView = () => {
        const
            boardColumnFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').id),
            boardColumnOrderFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='order_in_board_column').id),
            boardColumnIDsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[],
                (options:Ioption[])=>{
                    const len = options.length
                    if (!len) return []
                    else if (len===1) return [options[0].id]
                    else return Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)
                }
            ),[]),
            boardColumnIDs = useAppSelector(state => boardColumnIDsSelector(state)),
            columnTaskIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    if (!boardColumnIDs.length) return '{}'
                    const 
                        tasks = taskSelector.selectAll(state),
                        uid = state.misc.uid,
                        objs = boardColumnIDs.map(e=>{
                            const 
                                tasksOfThisColumn = tasks.filter(t=>{
                                    const {isGroupTask} = t
                                    return t[boardColumnFieldID]===e && (isGroupTask ? [...t.supervisors,...t.participants,...t.viewers,t.owner,t.assignee].includes(uid) : t.owner===uid)
                                }),
                                len = tasksOfThisColumn.length,
                                value = !len ? [] : len===1 ? [tasksOfThisColumn[0].id] : tasksOfThisColumn.sort((a,b)=>a[boardColumnOrderFieldID] - b[boardColumnOrderFieldID]).map(({id})=>id)
                            return {[e]:value}
                        })
                    return boardColumnIDs.length===1 ? JSON.stringify(objs[0]) : JSON.stringify(objs.reduce((a,b)=>({...a,...b})))
                }
            ),[boardColumnFieldID,boardColumnIDs,boardColumnOrderFieldID]),
            columnTaskIDs = useAppSelector(state => columnTaskIdSelector(state)),
            [state,boardViewDispatch] = useReducer(reducer,initialState),
            store = useStore(),
            dispatch = useAppDispatch(),
            [taskMovedInBoard] = useTaskMovedInBoardMutation(),
            dispatchTaskMovedInBoard = (taskID:EntityId,newColumnID:EntityId,newIdxInColumn:number) => {
                taskMovedInBoard({taskID,newColumnID,newIdxInColumn,active:true})
            },
            [updateTaskInBoard] = useFuncWithTimeout(dispatchTaskMovedInBoard,1000),
            taskJustMoved = () => updateTaskInBoard(
                state.taskMoving,
                state.columnIDs[state.columnIdx],
                state.taskIdx,
            ),
            dispatchColumnIDs = () => {
                const 
                    s = store.getState() as ReduxState,
                    fieldType = 'board_column',
                    boardColumnFieldObj = taskFieldSelector.selectAll(s).find(e=>e.fieldType===fieldType),
                    details = boardColumnFieldObj.details,
                    options = details.options as Ioption[],
                    len = options.length,
                    originalIDs = !len ? [] : len===1 ? [options[0].id] : Array.from(options).sort((a,b)=>a.order - b.order).map(({id})=>id)

                if (state.columnIDs.length === len && state.columnIDs.every((e,i)=>originalIDs.indexOf(e)===i)) return

                const newOptions:Ioption[] = state.columnIDs.map((columnID,i)=>({
                    id:columnID,
                    name:options.find(opt=>opt.id===columnID).name,
                    order:i
                }))

                dispatch(taskApi.endpoints.editCustomField.initiate({
                    id:boardColumnFieldID,
                    f:{
                        name:boardColumnFieldObj.fieldName,
                        fieldType,
                        defaultValues:{[fieldType]:details.default},
                        options:{[fieldType]:newOptions}
                    }
                }))
            },
            [updateColumnChange] = useFuncWithTimeout(dispatchColumnIDs,500),
            checkSameOrderFromState = () => {
                const 
                    s = store.getState() as ReduxState,
                    uid = s.misc.uid,
                    columns = taskFieldSelector.selectAll(s).find(e=>e.fieldType==='board_column').details.options as Ioption[]
                if (columns.length !== state.columnIDs.length) return false
                const sameColumnOrder = columns.every((e,i)=>state.columnIDs.indexOf(e.id)==i)
                if (!sameColumnOrder) return false

                const 
                    len = columns.length,
                    tasks = taskSelector.selectAll(s)
                for (let i=0; i<len; i++){
                    const 
                        thisColumnID = columns[i].id,
                        tasksOfThisColumn = tasks.filter(t=>{
                            const {isGroupTask} = t
                            return t[boardColumnFieldID]===thisColumnID && (isGroupTask ? [...t.supervisors,...t.participants,...t.viewers,t.owner,t.assignee].includes(uid) : t.owner===uid)
                        }),
                        l = tasksOfThisColumn.length
                    if (l !== state.itemsEachColumn[thisColumnID].length) return false
                    const
                        sortedTaskIDs = !l ? [] : l===1 ? [tasksOfThisColumn[0].id] : Array.from(tasksOfThisColumn).sort((a,b)=>a[boardColumnOrderFieldID] - b[boardColumnOrderFieldID]).map(({id})=>id),
                        allTasksSameOrder = sortedTaskIDs.every((e,j)=>state.itemsEachColumn[thisColumnID].indexOf(e)===j)
                    if (!allTasksSameOrder) return false
                }
                return true
            }

        useEffect(()=>{
            if (!!state.columnIDs.length) updateColumnChange()
        },[state.columnIDs])
        
        useEffect(()=>{
            const sameAsPrev = checkSameOrderFromState()
            if (!sameAsPrev){
                boardViewDispatch(init({
                    columnIDs:boardColumnIDs,
                    taskMoving:state.taskMoving,
                    columnMoving:state.columnMoving,
                    itemsEachColumn:JSON.parse(columnTaskIDs),
                    columnIdx:state.columnIdx,
                    taskIdx:state.taskIdx
                }))
            }
        },[
            columnTaskIDs,
            boardColumnIDs
        ])

        useEffect(()=>{
            if (!!state.taskMoving && state.columnIdx !== -1 && state.taskIdx !== -1) taskJustMoved()
        },[
            state.taskMoving,
            state.columnIdx,
            state.taskIdx
        ])

        return (
            <BoardViewDispatchContext.Provider value={{boardViewDispatch}}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {state.columnIDs.map((id,i)=>(
                                <ColumnName key={id} {...{
                                    id,
                                    columnCount:state.columnIDs.length,
                                    columnIdx:i,
                                }} />
                            ))}
                        </TableRow>
                        <TableRow>
                            {state.columnIDs.map((id,i)=>(
                                <ColumnAddItem key={id} {...{
                                    id,
                                    boardColumnFieldID,
                                    columnIdx:i,
                                }} />
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            {state.columnIDs.map((columnID,i)=>(
                                <TableBodyColumn key={columnID} {...{
                                    taskIDs:state.itemsEachColumn[columnID],
                                    columnIdx:i,
                                    columnID,
                                    taskMoving:state.taskMoving,
                                    blankAreaVisible:!!state.columnMoving || !!state.taskMoving,
                                }} />
                            ))}
                        </TableRow>
                    </TableBody>
                </Table>
            </BoardViewDispatchContext.Provider>
        )
    },
    ColumnName = memo((
        {
            id,
            columnCount,
            columnIdx,
        }:{
            id:EntityId;
            columnCount:number;
            columnIdx:number;
        }
    )=>{
        const 
            columnNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>(taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[]).find(c=>c.id===id),
                (option:Ioption)=> !!option ? option.name : null
            ),[id]),
            columnName = useAppSelector(state => columnNameSelector(state)),
            {palette:{mode,grey,background}} = useTheme(),
            narrowBody = useNarrowBody(),
            {boardViewDispatch} = useContext(BoardViewDispatchContext),
            onDragStart = () => boardViewDispatch(columnStartMoving(id)),
            onDragEnter = () => boardViewDispatch(moving({columnIdx,taskIdx:0}))

        return (
            <>
            {!!columnName && !narrowBody && <TableCell 
                sx={{
                    backgroundColor:'transparent',
                    width:`${100/columnCount}%`,
                    border:'none',
                    p:'3px',
                }}
                draggable
                onDragStart={onDragStart}
                onDragEnter={onDragEnter}
                data-boardcolumnid={id}
            >
                <Box
                    sx={{
                        textTransform:'uppercase',
                        fontSize:'0.8rem',
                        fontWeight:'bold',
                        color:grey[mode==='light' ? 700 : 300],
                        textAlign:'center',
                        backgroundColor:background.paper,
                        py:0.5
                    }}
                >{columnName}</Box>
            </TableCell>}
            </>
        )
    }),
    ColumnAddItem = memo((
        {
            id,
            boardColumnFieldID,
            columnIdx,
        }:{
            id:EntityId;
            boardColumnFieldID:EntityId;
            columnIdx:number;
        }
    ) => {
        const 
            theme = useTheme(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => dialogCtxMenuStatusDispatch(addTaskAction({[boardColumnFieldID]:id})),
            {boardViewDispatch} = useContext(BoardViewDispatchContext),
            onDragEnter = () => boardViewDispatch(moving({columnIdx,taskIdx:0})),
            narrowBody = useNarrowBody()

        return (
            <>
            {!narrowBody && <TableCell
                sx={{
                    padding:'3px',
                    backgroundColor:'transparent',
                    border:'none',
                }}
                onDragEnter={onDragEnter}
            >
                <Grid
                    container
                    direction='row'
                    sx={{
                        justifyContent:'center',
                        border:`3px dashed ${theme.palette.grey[theme.palette.mode==='light' ? 300 : 700]}`,
                        cursor:'pointer',
                        '&:hover':{
                            borderColor:theme.palette.grey[500],
                            '.MuiSvgIcon-root':{fill:theme.palette.grey[500]}
                        }
                    }}
                    onClick={onClick}
                >
                    <AddRoundedIcon htmlColor={theme.palette.grey[theme.palette.mode==='light' ? 400 : 600]} sx={{width:'1.8rem',height:'1.8rem',transition:'none'}} />
                </Grid>
            </TableCell>}
            </>
        )
    }),
    TableBodyColumn = memo((
        {
            taskIDs,
            taskMoving,
            columnIdx,
            columnID,
            blankAreaVisible,
        }:{
            taskIDs:EntityId[];
            taskMoving:EntityId;
            columnIdx:number;
            columnID:EntityId;
            blankAreaVisible:boolean;
        }
    )=>{
        const
            {boardViewDispatch} = useContext(BoardViewDispatchContext),
            onDragEnter = () => boardViewDispatch(moving({columnIdx,taskIdx:taskIDs.includes(taskMoving) ? taskIDs.length - 1 : taskIDs.length})),
            smallScreenColumnID = useAppSelector(state => state.taskMgmt.boardViewSmallScreenColumn),
            narrowBody = useNarrowBody()

        return (
            <>
            {(!narrowBody || smallScreenColumnID===columnID) && <TableCell
                sx={{
                    border:'none',
                    p:'3px',
                    verticalAlign:'top',
                }}
            >
                    <Stack direction='column' spacing={1}>
                        {taskIDs.map((taskID,i)=>(
                            <TaskItem key={taskID} {...{
                                taskID,
                                columnIdx,
                                taskIdx:i,
                            }} />
                        ))}
                    </Stack>
                <Box
                    sx={{
                        height:blankAreaVisible ? 'var(--viewport-height)' : '0px',
                    }}
                    onDragEnter={onDragEnter}
                ></Box>
            </TableCell>}
            </>
        )
    })
    

ColumnName.displayName = 'ColumnName'
ColumnAddItem.displayName = 'ColumnAddItem'
TableBodyColumn.displayName = 'TableBodyColumn'
export default BoardView
export { BoardViewDispatchContext }