import React, { createContext, Dispatch, memo, useCallback, useEffect, useMemo, useReducer, useRef, useState, MouseEvent as ReactMouseEvent } from "react";
import Grid from '@mui/material/Grid';
import TableContainer from '@mui/material/TableContainer';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { 
    taskFieldSelector, 
    taskSelector,
} from "../reducers/slice";
import { createSelector, EntityId } from "@reduxjs/toolkit";
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
import { Iaction, initialState, movingAction, reducer, startMovingAction } from "./column-reducer";
import TableCell from "@mui/material/TableCell";
import { useTheme } from "@mui/material";
import { updateSession } from "@components/functions";
import ChildTasksStatus from "./child-tasks-status";
import { updateRouterHistory } from "@reducers/misc";
import TimeAccumulated from "./timer";
import Parent from "./parent";
import useNarrowBody from "hooks/theme/narrow-body";
import useUpdateListColumnState from "./hooks/update-state";
import useDragManager from "@hooks/drag/drag-manager";

const 
    ResizerDragContent = createContext<{resizerDragAction:(dragging:boolean)=>void;}>({resizerDragAction:()=>{}}),
    getFieldID = (id:string) => `task-list-table-${id}`,
    ListView = () => {
        const 
            {palette:{grey,background}} = useTheme(),
            narrowBody = useNarrowBody(),
            [resizerDragging,setResizerDragging] = useState(false),
            dragTimer = useRef<NodeJS.Timeout>(),
            resizerDragAction = useCallback((dragging:boolean)=>{
                clearTimeout(dragTimer.current)
                if (dragging) setResizerDragging(true)
                else dragTimer.current = setTimeout(()=>setResizerDragging(false),100)
            },[]),
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
            [columnState,columnDispatch] = useReducer(reducer,initialState),
            onDragStart = useCallback((idx:number) => columnDispatch(startMovingAction(columnState.fields[idx])),[columnState.fields]),
            onDragEnter = useCallback((idx:number) => columnDispatch(movingAction(idx)),[]),
            startingPoint = useRef({touchX:-1,touchY:-1,rectLeft:-1,rectTop:-1}),
            tablebody = useRef<HTMLTableSectionElement>(),
            clonedElem = useRef<HTMLElement>(null),
            containerRef = useRef<HTMLDivElement>(),
            indexeddbOK = useAppSelector(state => state.misc.indexeddbOK),
            {handleDragStart,handleDragMove,handleDragEnd} = useDragManager(
                onDragStart,
                onDragEnter,
                columnState.fields,
                getFieldID,
                clonedElem,
            ),
            dragStart = (x:number,y:number,i:number) => {
                if (!indexeddbOK) return

                clonedElem.current = document.createElement('table')
                const 
                    field = columnState.fields[i],
                    thead = document.createElement('thead'),
                    headTr = document.createElement('tr'),
                    th = document.querySelector(`th.${field}`) as HTMLTableCellElement,
                    newTh = th.cloneNode(true) as HTMLTableCellElement,
                    {left,top} = th.getBoundingClientRect()

                headTr.style.cssText = th.parentElement.style.cssText
                thead.style.cssText = th.parentElement.parentElement.style.cssText
                clonedElem.current.style.cssText = th.parentElement.parentElement.parentElement.style.cssText

                newTh.style.width = `${th.getBoundingClientRect().width}px`

                headTr.appendChild(newTh)
                thead.appendChild(headTr)
                clonedElem.current.appendChild(thead)

                const tbody = document.createElement('tbody')
                tbody.style.cssText = tablebody.current.style.cssText

                const 
                    bodyTr = document.createElement('tr'),
                    tableRow = tablebody.current.querySelector('tr')
                bodyTr.style.cssText = tableRow.style.cssText

                const cells = tablebody.current.querySelectorAll(`.${field}`)
                cells.forEach(e=>{
                    const 
                        cell = e.cloneNode(true) as HTMLTableCellElement,
                        rowTr = bodyTr.cloneNode(true)

                    cell.style.cssText = (e as HTMLTableCellElement).style.cssText
                    cell.style.height = `${e.getBoundingClientRect().height}px`

                    rowTr.appendChild(cell)
                    tbody.appendChild(rowTr)
                })

                clonedElem.current.style.zIndex = '3'
                clonedElem.current.style.backgroundColor = background.default
                clonedElem.current.appendChild(tbody)

                handleDragStart(i,{left,top})

                containerRef.current.appendChild(clonedElem.current)

                startingPoint.current = {touchX:x,touchY:y,rectLeft:left,rectTop:top}

                onDragStart(i)
            },
            dragMove = (x:number,y:number) => {
                clonedElem.current.style.left = `${x - startingPoint.current.touchX + startingPoint.current.rectLeft}px`
                clonedElem.current.style.top = `${y - startingPoint.current.touchY + startingPoint.current.rectTop}px`

                const {top,bottom} = containerRef.current.getBoundingClientRect()
                handleDragMove(x,y,{top,bottom})
            },
            dragEnd = () => {
                handleDragEnd()
                if (!!clonedElem.current) {
                    clonedElem.current.remove()
                    clonedElem.current = null
                }
            },
            mouseDragging = useRef(false),
            handleMouseDown = (x:number,y:number,i:number) => {
                mouseDragging.current = true
                dragStart(x,y,i)
            },
            onMouseMove = (e:MouseEvent) => {
                if (mouseDragging.current) dragMove(e.pageX,e.pageY)
            },
            onMouseUp = () => {
                mouseDragging.current = false
                dragEnd()
            }

        useUpdateListColumnState(columnState.fields,columnDispatch)

        useEffect(()=>{
            return () => clearTimeout(dragTimer.current)
        },[])

        useEffect(()=>{
            window.addEventListener('mousemove',onMouseMove,{passive:true})
            window.addEventListener('mouseup',onMouseUp,{passive:true})
            return () => {
                window.removeEventListener('mousemove',onMouseMove)
                window.removeEventListener('mouseup',onMouseUp)
            }
        },[columnState.fields])

        return (
            <Grid
                sx={{margin:'auto',...(!narrowBody && {mx:2.5,mt:2})}}
                ref={containerRef}
            >
                <TableContainer
                    sx={{
                        maxHeight: `calc(var(--viewport-height) - ${!narrowBody ? 80 : 56}px)`,
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
                                                dragStart:(x:number,y:number)=>dragStart(x,y,i),
                                                dragMove,
                                                dragEnd,
                                                handleMouseDown:(x:number,y:number)=>handleMouseDown(x,y,i)
                                            }} 
                                            key={field} 
                                        />
                                    ))}
                                    <TableCell sx={{width:0,p:0}} />
                                </TableRow>
                            </TableHead>
                            <TableBody ref={tablebody}>
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
            onClick = (e:ReactMouseEvent<HTMLDivElement>) => {
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