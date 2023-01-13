import React, { createContext, memo, useCallback, useEffect, useMemo, useReducer, useRef, MouseEvent as ReactMouseEvent } from "react";
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
import { initialState, movingAction, reducer, startMovingAction } from "./column-reducer";
import TableCell from "@mui/material/TableCell";
import { useTheme } from "@mui/material";
import { updateSession } from "@components/functions";
import ChildTasksStatus from "./child-tasks-status";
import { updateRouterHistory } from "@reducers/misc";
import TimeAccumulated from "./timer";
import Parent from "./parent";
import useNarrowBody from "hooks/theme/narrow-body";
import useUpdateListColumnState from "./hooks/update-state";
import useOneDimensionalDrag from "@hooks/drag/one-dimensional-drag";
import useCloneSingleTableColumn from "./hooks/clone-single-table-column";
import useResizerDrag from "./hooks/resizer-drag";
import useSelectTaskIDs from "./hooks/select-task-ids";
import useFuncWithTimeout from "@hooks/counter/function-with-timeout";
import useWindowEventListeners from "@hooks/event-listeners/window";

const 
    ResizerDragContent = createContext<{resizerDragAction:(dragging:boolean)=>void;}>({resizerDragAction:()=>{}}),
    getFieldID = (id:string) => `task-list-table-${id}`,
    ListView = () => {
        const 
            router = useRouter(),
            taskView = router.query.view as string,
            {palette:{grey}} = useTheme(),
            narrowBody = useNarrowBody(),
            {resizerDragging,resizerDragAction} = useResizerDrag(),
            taskIDs = useSelectTaskIDs(),
            indexeddbOK = useAppSelector(state => state.misc.indexeddbOK),

            // below for dragging columns
            [columnState,columnDispatch] = useReducer(reducer,initialState),
            onDragStart = useCallback((idx:number) => columnDispatch(startMovingAction(columnState.fields[idx])),[columnState.fields]),
            onDragEnter = useCallback((idx:number) => columnDispatch(movingAction(idx)),[]),
            startingPoint = useRef({touchX:-1,touchY:-1,rectLeft:-1,rectTop:-1}),
            clonedElem = useRef<HTMLElement>(null),
            containerRef = useRef<HTMLDivElement>(),
            containerMeasurement = useRef({t:0,b:0}),
            updateContainerMeasurement = () => {
                if (taskView === 'list'){
                    const {top,bottom} = containerRef.current.getBoundingClientRect()
                    containerMeasurement.current = {t:top,b:bottom}
                }
            },
            [onResize] = useFuncWithTimeout(updateContainerMeasurement,100),
            {handleDragStart,handleDragMove,handleDragEnd} = useOneDimensionalDrag(
                onDragStart,
                onDragEnter,
                columnState.fields,
                getFieldID,
                clonedElem,
            ),
            cloneColumn = useCloneSingleTableColumn(),
            dragStart = (x:number,y:number,i:number) => {
                if (!indexeddbOK) return

                const field = columnState.fields[i]
                clonedElem.current = cloneColumn(field)
                const {left,top} = document.querySelector(`th.${field}`).getBoundingClientRect()
                handleDragStart(i,{left,top})
                containerRef.current.appendChild(clonedElem.current)
                startingPoint.current = {touchX:x,touchY:y,rectLeft:left,rectTop:top}
            },
            dragMove = (x:number,y:number) => {
                clonedElem.current.style.left = `${x - startingPoint.current.touchX + startingPoint.current.rectLeft}px`
                clonedElem.current.style.top = `${y - startingPoint.current.touchY + startingPoint.current.rectTop}px`
                handleDragMove(x,y,{top:containerMeasurement.current.t,bottom:containerMeasurement.current.b})
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
            onResize()
            window.addEventListener('resize',onResize,{passive:true})
            return () => window.removeEventListener('resize',onResize)
        },[taskView])

        useWindowEventListeners([
            {evt:'mousemove',func:onMouseMove},
            {evt:'mouseup',func:onMouseUp},
        ],[columnState.fields])

        return (
            <Grid
                sx={{margin:'auto',...(!narrowBody && {mx:2.5,mt:2})}}
                ref={containerRef}
            >
                <TableContainer
                    sx={{
                        maxHeight: `calc(var(--viewport-height) - ${!narrowBody ? 80 : 56}px)`,
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
                            <TableBody id='task-list-table-body'>
                                {taskIDs.map(id=>(<ListViewRow key={id} {...{id,fields:columnState.fields,resizerDragging}} />))}
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
            resizerDragging,
        }:{
            id:EntityId;
            fields:EntityId[];
            resizerDragging:boolean;
        }
    )=>{
        const 
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
                {fields.map(field=>(
                    <CellDivert 
                        {...{
                            id,
                            field,
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
        }:{
            id:EntityId;
            field:EntityId;
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
            {field==='approval' && <Approval {...{id,hasEditRight}} />}
            {fieldType==='single_person' && <SinglePerson {...{id,field,editMode}} />}
            {fieldType==='date' && <DateElem {...{id,field,hasEditRight,editMode}} />}
            {fieldType==='short_text' && <StringElem {...{id,field,editMode}} />}
            {fieldType==='people' && <People {...{id,field,editMode}} />}
            {fieldType==='number' && <NumberElem {...{id,field,hasEditRight,editMode}} />}
            {fieldType==='link' && <LinkElem {...{id,field,editMode}} />}
            {fieldType==='checkbox' && <CheckboxElem {...{id,hasEditRight,field}} />}
            {fieldType==='dropdown' && <DropdownElem {...{id,hasEditRight,field}} />}
            {fieldType==='tags' && <TagsElem {...{id,field,editMode}} />}
            {fieldType==='child_status' && <ChildTasksStatus {...{id}} />}
            {fieldType==='timer' && <TimeAccumulated {...{id}} />}
            {fieldType==='parents' && <Parent {...{id,editMode}} />}
            {!isTouchScreen && <Resizer field={field} id={id} />}
            </>
        )
    })
ListViewRow.displayName = 'ListViewRow'
CellDivert.displayName = 'CellDivert'
export default ListView
export { ResizerDragContent }