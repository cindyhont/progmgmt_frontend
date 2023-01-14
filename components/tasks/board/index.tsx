import React, { createContext, Dispatch, memo, MouseEvent as ReactMouseEvent, useContext, useMemo, useReducer, useRef } from "react";
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Stack from '@mui/material/Stack';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { ReduxState, useAppSelector } from "@reducers";
import { taskFieldSelector } from "../reducers/slice";
import { useTheme } from "@mui/material";
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { addTaskAction } from "../reducers/dialog-ctxmenu-status";
import { columnStartMoving, Iaction, initialState, moving, reducer, taskStartMoving } from "./reducer";
import { DialogCtxMenuDispatchContext } from "../contexts";
import TaskItem from "./task-item";
import useNarrowBody from "@hooks/theme/narrow-body";
import useStateManager from "./hooks/state-manager";
import useTwoDimensionalDrag from "./hooks/two-d-drag";
import useCloneSingleTableColumn from "./hooks/clone-single-table-column";
import useWindowEventListeners from "@hooks/event-listeners/window";

export interface Ioption {
    id:EntityId;
    name:string;
    order:number;
}

const 
    BoardViewDispatchContext = createContext<{
        boardViewDispatch:Dispatch<Iaction>,
        handleTaskMouseDown:(x:number,y:number,i:number,j:number)=>void;
        taskDragStart:(x:number,y:number,i:number,j:number)=>void;
        dragMove:(x:number,y:number)=>void;
        dragEnd:()=>void;
    }>({
        boardViewDispatch:()=>{},
        handleTaskMouseDown:()=>{},
        taskDragStart:()=>{},
        dragMove:()=>{},
        dragEnd:()=>{},
    }),
    BoardView = () => {
        const
            narrowBody = useNarrowBody(),
            [boardViewState,boardViewDispatch] = useReducer(reducer,initialState),
            boardColumnFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').id),
            tableID = useRef('task-board-table').current,

            // functions below for drag and drop
            containerTable = useRef<HTMLTableElement>(),
            onColumnDragStart = (id:EntityId) => boardViewDispatch(columnStartMoving(id)),
            onTaskDragStart = (taskID:EntityId) => boardViewDispatch(taskStartMoving(taskID)),
            onDragEnter = (columnIdx:number,taskIdx:number) => boardViewDispatch(moving({columnIdx,taskIdx})),
            clonedElem = useRef<HTMLElement>(null),
            {
                handleColumnDragStart,
                handleTaskDragStart,
                handleDragMove,
                handleDragEnd,
            } = useTwoDimensionalDrag(
                onColumnDragStart,
                onTaskDragStart,
                onDragEnter,
                tableID,
                boardViewState.columnIDs,
                boardViewState.itemsEachColumn,
                clonedElem
            ),
            startingPoint = useRef({touchX:0,touchY:0,rectLeft:0,rectTop:0}),
            cloneColumn = useCloneSingleTableColumn(),
            columnDragStart = (x:number,y:number,i:number) => {
                const 
                    columnID = boardViewState.columnIDs[i],
                    originalModule = document.getElementById(`${columnID}`),
                    {left,top} = originalModule.getBoundingClientRect()

                clonedElem.current = cloneColumn(columnID)
                handleColumnDragStart(columnID)
                containerTable.current.appendChild(clonedElem.current)
                startingPoint.current = {touchX:x,touchY:y,rectLeft:left,rectTop:top}
            },
            taskDragStart = (x:number,y:number,i:number,j:number) => {
                const 
                    columnID = boardViewState.columnIDs[i],
                    taskID = boardViewState.itemsEachColumn[columnID][j],
                    originalModule = document.getElementById(`task-board-task-${taskID}`),
                    {left,top,width,height} = originalModule.getBoundingClientRect()
                    
                clonedElem.current = originalModule.cloneNode(true) as HTMLElement
                handleTaskDragStart(taskID,{left,top,width,height})
                containerTable.current.appendChild(clonedElem.current)
                startingPoint.current = {touchX:x,touchY:y,rectLeft:left,rectTop:top}
            },
            dragMove = (x:number,y:number) => {
                clonedElem.current.style.left = `${x - startingPoint.current.touchX + startingPoint.current.rectLeft}px`
                clonedElem.current.style.top = `${y - startingPoint.current.touchY + startingPoint.current.rectTop}px`
                handleDragMove(x,y)
            },
            dragEnd = () => {
                handleDragEnd()
                if (!!clonedElem.current) {
                    clonedElem.current.remove()
                    clonedElem.current = null
                }
            },
            mouseDragging = useRef(false),
            handleColumnMouseDown = (x:number,y:number,i:number) => {
                mouseDragging.current = true
                columnDragStart(x,y,i)
            },
            handleTaskMouseDown = (x:number,y:number,i:number,j:number) => {
                mouseDragging.current = true
                taskDragStart(x,y,i,j)
            },
            onMouseMove = (e:MouseEvent) => {
                if (mouseDragging.current) dragMove(e.pageX,e.pageY)
            },
            onMouseUp = () => {
                mouseDragging.current = false
                dragEnd()
            }

        useStateManager(boardViewState,boardViewDispatch,boardColumnFieldID)

        useWindowEventListeners([
            {evt:'touchend',func:dragEnd},
            {evt:'touchcancel',func:dragEnd},
        ])

        useWindowEventListeners([
            {evt:'mousemove',func:onMouseMove},
            {evt:'mouseup',func:onMouseUp},
        ],[boardViewState])

        return (
            <BoardViewDispatchContext.Provider value={{
                boardViewDispatch,
                handleTaskMouseDown,
                taskDragStart,
                dragMove,
                dragEnd,
            }}>
                <Table stickyHeader size="small" id={tableID} ref={containerTable}>
                    {!narrowBody && <TableHead>
                        <TableRow>
                            {boardViewState.columnIDs.map((id,i)=>(
                                <ColumnName key={id} {...{
                                    id,
                                    columnCount:boardViewState.columnIDs.length,
                                    columnIdx:i,
                                    handleColumnMouseDown:(x:number,y:number)=>handleColumnMouseDown(x,y,i),
                                }} />
                            ))}
                        </TableRow>
                        <TableRow>
                            {boardViewState.columnIDs.map((id,i)=>(
                                <ColumnAddItem key={id} {...{
                                    id,
                                    boardColumnFieldID,
                                    columnIdx:i,
                                }} />
                            ))}
                        </TableRow>
                    </TableHead>}
                    <TableBody>
                        <TableRow>
                            {boardViewState.columnIDs.map((columnID,i)=>(
                                <TableBodyColumn key={columnID} {...{
                                    taskIDs:boardViewState.itemsEachColumn[columnID],
                                    columnIdx:i,
                                    columnID,
                                    taskMoving:boardViewState.taskMoving,
                                    blankAreaVisible:!!boardViewState.columnMoving || !!boardViewState.taskMoving,
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
            handleColumnMouseDown
        }:{
            id:EntityId;
            columnCount:number;
            handleColumnMouseDown:(x:number,y:number)=>void;
        }
    )=>{
        const 
            columnNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>(taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.options as Ioption[]).find(c=>c.id===id),
                (option:Ioption)=> !!option ? option.name : null
            ),[id]),
            columnName = useAppSelector(state => columnNameSelector(state)),
            {palette:{mode,grey,background}} = useTheme(),
            onMouseDown = (e:ReactMouseEvent<HTMLTableCellElement>) => handleColumnMouseDown(e.pageX,e.pageY)

        return (
            <>
            {!!columnName && <TableCell 
                sx={{
                    backgroundColor:'transparent',
                    width:`${100/columnCount}%`,
                    border:'none',
                    p:'3px',
                    cursor:'grab'
                }}
                onMouseDown={onMouseDown}
                id={`${id}`}
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
            {palette:{mode,grey}} = useTheme(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => dialogCtxMenuStatusDispatch(addTaskAction({[boardColumnFieldID]:id})),
            {boardViewDispatch} = useContext(BoardViewDispatchContext),
            onDragEnter = () => boardViewDispatch(moving({columnIdx,taskIdx:0}))

        return (
            <TableCell
                sx={{
                    padding:'3px',
                    backgroundColor:'transparent',
                    border:'none',
                }}
                onDragEnter={onDragEnter}
                id={`task-board-add-column-task-${id}`}
            >
                <Grid
                    container
                    direction='row'
                    sx={{
                        justifyContent:'center',
                        border:`3px dashed ${grey[mode==='light' ? 300 : 700]}`,
                        cursor:'pointer',
                        '&:hover':{
                            borderColor:grey[500],
                            '.MuiSvgIcon-root':{fill:grey[500]}
                        }
                    }}
                    onClick={onClick}
                >
                    <AddRoundedIcon htmlColor={grey[mode==='light' ? 400 : 600]} sx={{width:'1.8rem',height:'1.8rem',transition:'none'}} />
                </Grid>
            </TableCell>
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
                id={`task-board-table-body-column-${columnID}`}
                aria-label={`${columnID}`}
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