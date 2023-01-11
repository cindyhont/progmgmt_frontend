import React, { createContext, Dispatch, memo, useContext, useMemo, useReducer } from "react";
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
import { columnStartMoving, Iaction, initialState, moving, reducer } from "./reducer";
import { DialogCtxMenuDispatchContext } from "../contexts";
import TaskItem from "./task-item";
import useNarrowBody from "hooks/theme/narrow-body";
import useStateManager from "./hooks/state-manager";

export interface Ioption {
    id:EntityId;
    name:string;
    order:number;
}

const 
    BoardViewDispatchContext = createContext<{boardViewDispatch:Dispatch<Iaction>}>({boardViewDispatch:()=>{}}),
    BoardView = () => {
        const
            [boardViewState,boardViewDispatch] = useReducer(reducer,initialState),
            boardColumnFieldID = useAppSelector(state=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').id)

        useStateManager(boardViewState,boardViewDispatch,boardColumnFieldID)

        return (
            <BoardViewDispatchContext.Provider value={{boardViewDispatch}}>
                <Table stickyHeader size="small">
                    <TableHead>
                        <TableRow>
                            {boardViewState.columnIDs.map((id,i)=>(
                                <ColumnName key={id} {...{
                                    id,
                                    columnCount:boardViewState.columnIDs.length,
                                    columnIdx:i,
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
                    </TableHead>
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