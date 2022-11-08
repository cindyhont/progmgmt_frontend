import React, { createContext, Dispatch, memo, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, MouseEvent } from "react";
import Grid from '@mui/material/Grid';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { 
    taskEditMultipleFields, 
    taskFieldSelector, 
    taskSelector,
} from "../reducers/slice";
import { createSelector, EntityId, Update } from "@reduxjs/toolkit";
import StringElem from "./string";
import DateElem from "./date";
import SinglePerson from "./single-person";
import HeaderCell from "./header-cell";
import Resizer from "./resizer";
import People from "./people";
import { Task, TaskField } from "../interfaces";
import NumberElem from "./number";
import LinkElem from "./link";
import CheckboxElem from "./checkbox";
import DropdownElem from "./dropdown";
import TagsElem from "./tags";
import { useStore } from "react-redux";
import Approval from "./approval";
import { useRouter } from "next/router";
import IndexedDB from "@indexeddb";
import { Iaction, initialState, movingAction, reducer, setAllAction, startMovingAction } from "./column-reducer";
import { LayoutOrderDispatchContext } from "@pages";
import TableCell from "@mui/material/TableCell";
import { useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { updateSession } from "@components/functions";
import ChildTasksStatus from "./child-tasks-status";
import { updateRouterHistory } from "@reducers/misc";
import TimeAccumulated from "./timer";
import Parent from "./parent";

const 
    createColumnListSelector = (wideScreen:boolean)=>createSelector(
        (state:ReduxState)=>state,
        (state:ReduxState)=>{
            const 
                key = wideScreen ? 'listWideScreenOrder' : 'listNarrowScreenOrder',
                fields = taskFieldSelector.selectAll(state).filter(e=>e[key]!==-1)
            return fields.length === 0 ? [] : fields.length === 1 ? [fields[0].id] : Array.from(fields).sort((a,b)=>a[key]-b[key]).map(({id})=>id)
        }
    ),
    ResizerDragContent = createContext<{resizerDragAction:(dragging:boolean)=>void;}>({resizerDragAction:()=>{}}),
    ListView = () => {
        const 
            dispatch = useAppDispatch(),
            theme = useTheme(),
            {palette:{grey}} = theme,
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            matchesMD = useMediaQuery(theme.breakpoints.up('md')),
            sidebarOpen = useAppSelector(state => state.misc.sidebarOpen),
            idb = useRef<IndexedDB>(),
            store = useStore(),
            [resizerDragging,setResizerDragging] = useState(false),
            dragTimer = useRef<NodeJS.Timeout>(),
            resizerDragAction = useCallback((dragging:boolean)=>{
                clearTimeout(dragTimer.current)
                if (dragging) setResizerDragging(true)
                else dragTimer.current = setTimeout(()=>setResizerDragging(false),100)
            },[]),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            idsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectAll(state),
                (state:ReduxState)=>state.misc.uid,
                (tasks:Task[],uid:EntityId)=>{
                    const filteredTasks = tasks.filter(t=>{
                        const 
                            {isGroupTask} = t,
                            allRights = [t.owner],
                            arr = isGroupTask ? [...t.supervisors,...allRights,...t.participants,...t.viewers,t.assignee,t.owner] : allRights
                        return arr.includes(uid)
                    })
                    return filteredTasks.map(({id})=>id)
                }
            ),[]),
            ids = useAppSelector(state => idsSelector(state)),
            wideScreenColumnListSelector = useMemo(()=>createColumnListSelector(true),[]),
            narrowScreenColumnListSelector = useMemo(()=>createColumnListSelector(false),[]),
            listColumnsWideScreen = useAppSelector(state => wideScreenColumnListSelector(state)),
            listColumnsNarrowScreen = useAppSelector(state => narrowScreenColumnListSelector(state)),
            [columnState,columnDispatch] = useReducer(reducer,initialState),
            onDragStart = useCallback((idx:number) => columnDispatch(startMovingAction(columnState.fields[idx])),[columnState.fields]),
            onDragEnter = useCallback((idx:number) => columnDispatch(movingAction(idx)),[]),
            setFromRedux = (arr:EntityId[]) => {
                if (columnState.fields.length === arr.length && columnState.fields.every((e,i)=>arr.indexOf(e)===i)) return
                columnDispatch(setAllAction(arr))
            },
            updateReduxIDB = () => {
                const
                    wideScreen = matchesMD || matchesSM && !sidebarOpen,
                    state = store.getState() as ReduxState,
                    key = wideScreen ? 'listWideScreenOrder' : 'listNarrowScreenOrder',
                    fieldsInRedux = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                    fieldCount = fieldsInRedux.length

                let updates:Update<TaskField>[] = []

                for (let i=0; i<fieldCount; i++){
                    const 
                        field = fieldsInRedux[i],
                        {id} = field,
                        newPos = columnState.fields.indexOf(id)
                    if (newPos !== field[key]) updates = [...updates,{id,changes:{[key]:newPos}}]
                }
                if (!updates.length) return
                
                dispatch(taskEditMultipleFields(updates))
                
                layoutOrderDispatch({payload:fieldsInRedux.map(
                    (
                        {
                            listWideScreenOrder,
                            listNarrowScreenOrder,
                            detailsSidebarOrder,
                            detailsSidebarExpand,
                            id
                        }
                    )=>({
                        listWideScreenOrder: wideScreen ? columnState.fields.indexOf(id) : listWideScreenOrder,
                        listNarrowScreenOrder: wideScreen ? listNarrowScreenOrder : columnState.fields.indexOf(id),
                        detailsSidebarOrder,
                        detailsSidebarExpand,
                        id
                    })
                )})
                
                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
            },
            timer = useRef<NodeJS.Timeout>(),
            tempStateOnChange = () => {
                clearTimeout(timer.current)
                timer.current = setTimeout(updateReduxIDB,500)
            }
            // [loaded,setLoaded] = useState(false)

        useEffect(()=>{
            // setLoaded(true)
            const s = store.getState() as ReduxState
            idb.current = new IndexedDB(s.misc.uid.toString(),1)
            return () => {
                clearTimeout(dragTimer.current)
            }
        },[])

        useEffect(()=>{
            const 
                wideScreen = matchesMD || matchesSM && !sidebarOpen,
                arr = wideScreen ? listColumnsWideScreen : listColumnsNarrowScreen
            setFromRedux(arr)
        },[matchesMD || matchesSM && !sidebarOpen])

        useEffect(()=>{
            if (matchesMD || matchesSM && !sidebarOpen) setFromRedux(listColumnsWideScreen)
        },[listColumnsWideScreen])

        useEffect(()=>{
            if (!matchesSM || !matchesMD && sidebarOpen) setFromRedux(listColumnsNarrowScreen)
        },[listColumnsNarrowScreen])

        useEffect(()=>{
            if (columnState.fields.length) tempStateOnChange()
        },[columnState.fields])

        return (
            <Grid
                sx={{margin:'auto',...((matchesMD || matchesSM && !sidebarOpen) && {mx:2.5,mt:2})}}
            >
                <TableContainer
                    sx={{
                        maxHeight: `calc(100vh - ${(matchesMD || matchesSM && !sidebarOpen) ? 80 : 56}px)`,
                        '& .MuiTableCell-head':{
                            // py:0.3
                        },
                        '& .MuiTableCell-root:first-of-type':{
                            borderLeft:`1px dotted ${grey[500]}`
                        },
                    }}
                >
                    <ResizerDragContent.Provider value={{resizerDragAction}}>
                        <Table 
                            stickyHeader 
                            size="small"
                            sx={{
                                '.hover + .resizer':{
                                    borderRight:`2px dashed ${grey[500]}`
                                }
                            }}
                        >
                            <TableHead>
                                <TableRow>
                                    {columnState.fields.map((field,i)=>(
                                        <HeaderCell 
                                            {...{
                                                field,
                                                onDragEnter:()=>onDragEnter(i),
                                                onDragStart:()=>onDragStart(i)
                                            }} 
                                            key={field} 
                                        />
                                    ))}
                                    <TableCell sx={{width:0,p:0}} />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ids.map(id=>(<ListViewRow key={id} {...{id,fields:columnState.fields,columnDispatch,resizerDragging}} />))}
                            </TableBody>
                        </Table>
                    </ResizerDragContent.Provider>
                </TableContainer>
            </Grid>
        )
    },
    ListViewRow = memo((
        {
            id,
            fields,
            columnDispatch,
            resizerDragging,
        }:{
            id:EntityId;
            fields:EntityId[];
            columnDispatch:Dispatch<Iaction>;
            resizerDragging:boolean;
        }
    )=>{
        const 
            onDragEnter = useCallback((idx:number)=>columnDispatch(movingAction(idx)),[]),
            editOn = useAppSelector(state => state.taskMgmt.editField),
            store = useStore(),
            timerRef = useRef<NodeJS.Timeout>(),
            wasEditing = useRef(false),
            activateTimer = () => {
                const state = store.getState() as ReduxState
                wasEditing.current = state.taskMgmt.editField

                if (wasEditing.current) timerRef.current = setTimeout(activateTimer,100)
            },
            router = useRouter(),
            dispatch = useAppDispatch(),
            onClick = (e:MouseEvent<HTMLDivElement>) => {
                if (resizerDragging) return
                const 
                    paths = e.nativeEvent.composedPath() as HTMLElement[],
                    count = paths.length
                
                if (wasEditing.current) return

                for (let i=0; i<count; i++){
                    const {dataset} = paths[i]
                    if (!dataset || Object.keys(dataset).length===0) continue
                    if (!!dataset.nottotask) return
                }
                updateSession(router,dispatch)
                dispatch(updateRouterHistory({
                    asPath:router.asPath,
                    queryString:JSON.stringify(router.query)
                }))
                router.push({query:{page:'tasks',taskid:id}},`/tasks/t/${id}`,{shallow:true})
            }

        useEffect(()=>{
            if (editOn) activateTimer()
        },[editOn])

        return (
            <TableRow onClick={onClick}>
                {fields.map((field,i)=>(
                    <CellDivert 
                        {...{
                            id,
                            field,
                            onDragEnter:()=>onDragEnter(i)
                        }} 
                        key={field} 
                    />
                ))}
                <TableCell sx={{width:0,p:0}} />
            </TableRow>
        )
    }),
    CellDivert = memo((
        {
            id,
            field,
            onDragEnter
        }:{
            id:EntityId;
            field:EntityId;
            onDragEnter:()=>void;
        }
    )=>{
        const 
            fieldType = useAppSelector(state => taskFieldSelector.selectById(state,field)?.fieldType || ''),
            hasEditRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,id),
                (state:ReduxState)=>taskFieldSelector.selectById(state,field),
                (state:ReduxState)=>state.misc.uid,
                (task:Task,fieldObj:TaskField,uid:EntityId)=> !!fieldObj?.details 
                    || field==='assignee' ? [...task.supervisors,task.owner,task.assignee].includes(uid) : [...task.supervisors,task.owner].includes(uid)
            ),[id,field]),
            hasEditRight = useAppSelector(state=>hasEditRightSelector(state)),
            editModeSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID===field,
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID===id,
                (state:ReduxState)=>state.taskMgmt.editField,
                (fieldMatch:boolean,taskIdMatch:boolean,editField:boolean) => fieldMatch && taskIdMatch && editField
            ),[id,field]),
            editMode = useAppSelector(state => editModeSelector(state)),
            isTouchScreen = useAppSelector(state => state.misc.isTouchScreen)

        return (
            <>
            {field==='approval' && <Approval {...{id,onDragEnter,hasEditRight}} />}
            {fieldType==='single_person' && <SinglePerson {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='date' && <DateElem {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='short_text' && <StringElem {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='people' && <People {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='number' && <NumberElem {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='link' && <LinkElem {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='checkbox' && <CheckboxElem {...{id,field,onDragEnter,hasEditRight}} />}
            {fieldType==='dropdown' && <DropdownElem {...{id,field,onDragEnter,hasEditRight}} />}
            {fieldType==='tags' && <TagsElem {...{id,field,onDragEnter,hasEditRight,editMode}} />}
            {fieldType==='child_status' && <ChildTasksStatus {...{id,onDragEnter}} />}
            {fieldType==='timer' && <TimeAccumulated {...{id,onDragEnter}} />}
            {fieldType==='parents' && <Parent {...{id,onDragEnter,editMode}} />}
            {!isTouchScreen && <Resizer field={field} id={id} />}
            </>
        )
    })
ListViewRow.displayName = 'ListViewRow'
CellDivert.displayName = 'CellDivert'
export default ListView
export { ResizerDragContent }