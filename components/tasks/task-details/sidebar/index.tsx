import React, { memo, MouseEvent as ReactMouseEvent, TouchEvent, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import Stack from '@mui/material/Stack'
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { grey } from '@mui/material/colors';
import { createSelector, EntityId } from "@reduxjs/toolkit";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography'
import { useStore } from "react-redux";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box'
import { useTheme } from "@mui/material";
import { taskEditMultipleFields, taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import { Task, TaskField } from "@components/tasks/interfaces";
import { initialState, movingAction, reducer, startMovingAction } from "./reducer";
import CheckboxElem from "./checkboxes";
import { People, SinglePerson } from "./people";
import Timer from "./timer";
import Files from "./files";
import Approval from "./approval";
import DateElem from "./dates";
import ShortText from "./short-text";
import Dropdown from "./dropdown";
import LinkElem from "./links";
import NumberElem from "./numbers";
import Tags from "./tags";
import { useRouter } from "next/router";
import { LayoutOrderDispatchContext } from "@pages";
import IndexedDB from "@indexeddb";
import Parent from "./parent";
import useDragContainsFiles from "@hooks/drag/drag-contains-files";
import useUpdateSidebarState from "./hooks/update-state";
import useDragManager from "@hooks/drag/drag-manager";

export const sideBarHeadStyle = {
    textTransform:'uppercase',
    fontSize:'0.7rem',
    fontWeight:'bold',
    color:grey[500],
    letterSpacing:'0.05rem',
    verticalAlign:'bottom',
}

export const createEditRightSelector = (fieldID:EntityId,taskID:string) => createSelector(
    (state:ReduxState)=>state,
    (state:ReduxState)=>{
        const field = taskFieldSelector.selectById(state,fieldID)
        if (!!field.details) return true
        const task = taskSelector.selectById(state,taskID)
        return [...task.supervisors,task.owner].includes(state.misc.uid)
    }
)

export const getTaskDetailsSidebarModuleID = (fieldID:EntityId | string) => `task-details-sidebar-module-${fieldID}`

const 
    Sidebar = memo(()=>{
        const 
            containerRef = useRef<HTMLDivElement>(),
            dragHasFiles = useDragContainsFiles(),
            [sidebarState,sidebarDispatch] = useReducer(reducer,initialState),
            onDragStart = useCallback((idx:number) => sidebarDispatch(startMovingAction(sidebarState.fields[idx])),[sidebarState.fields]),
            onDragEnter = useCallback((idx:number) => {
                if (!dragHasFiles) sidebarDispatch(movingAction(idx))
            },[dragHasFiles]),
            clonedElem = useRef<HTMLElement>(null),
            {handleDragStart,handleDragMove,handleDragEnd} = useDragManager(
                onDragStart,
                onDragEnter,
                sidebarState.fields,
                getTaskDetailsSidebarModuleID,
                clonedElem,
            ),
            startingPoint = useRef({touchX:0,touchY:0,rectLeft:0,rectTop:0}),
            dragStart = (x:number,y:number,i:number) => {
                const 
                    originalModule = document.getElementById(getTaskDetailsSidebarModuleID(sidebarState.fields[i])),
                    {left,top,width,height} = originalModule.getBoundingClientRect()

                clonedElem.current = originalModule.cloneNode(true) as HTMLElement
                handleDragStart(i,{...{left,top,width,height}})
                containerRef.current.appendChild(clonedElem.current)
                startingPoint.current = {touchX:x,touchY:y,rectLeft:left,rectTop:top}

                if (window.matchMedia('(hover:none)').matches){
                    let thisElem = containerRef.current as HTMLElement

                    while (!!thisElem && thisElem.tagName.toLowerCase() !== 'html'){
                        // const {left,top,width,height} = thisElem.getBoundingClientRect()
                        thisElem.style.overflowY = 'hidden'
                        thisElem.style.overscrollBehaviorY = 'none'
                        // thisElem.style.position = 'fixed'
                        // thisElem.style.top = `${top}px`
                        // thisElem.style.left = `${left}px`
                        // thisElem.style.width = `${width}px`
                        // thisElem.style.height = `${height}px`
                        thisElem = thisElem?.parentElement || null
                    }

                    // const {left,top,width,height} = containerRef.current.getBoundingClientRect()
                    // containerRef.current.style.position = 'fixed'
                    // document.body.style.overflowY = 'hidden'
                    // containerRef.current.style.overflowY = 'hidden'
                    // containerRef.current.style.top = `${top}px`
                    // containerRef.current.style.left = `${left}px`
                    // containerRef.current.style.width = `${width}px`
                    // containerRef.current.style.height = `${height}px`
                }
            },
            dragMove = (x:number,y:number)=>{
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

                if (window.matchMedia('(hover:none)').matches){
                    let thisElem = containerRef.current as HTMLElement

                    while (!!thisElem && thisElem.tagName.toLowerCase() !== 'html'){
                        thisElem.style.overflowY = null
                        thisElem.style.overscrollBehaviorY = null
                        // thisElem.style.position = null
                        // thisElem.style.top = null
                        // thisElem.style.left = null
                        // thisElem.style.width = null
                        // thisElem.style.height = null
                        thisElem = thisElem?.parentElement || null
                    }

                    // containerRef.current.style.position = null
                    // document.body.style.overflowY = null
                    // containerRef.current.style.overflowY = null
                    // containerRef.current.style.top = null
                    // containerRef.current.style.left = null
                    // containerRef.current.style.width = null
                    // containerRef.current.style.height = null
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

        useUpdateSidebarState(sidebarState.fields,sidebarDispatch)

        useEffect(()=>{
            window.addEventListener('mousemove',onMouseMove,{passive:true})
            window.addEventListener('mouseup',onMouseUp,{passive:true})
            return () => {
                window.removeEventListener('mousemove',onMouseMove)
                window.removeEventListener('mouseup',onMouseUp)
            }
        },[sidebarState.fields])

        return (
            <Stack 
                direction='column' 
                spacing={2} 
                pb={2}
                ref={containerRef}
                id='task-details-side-container'
            >
                {sidebarState.fields.map((fieldID,i)=>(
                    <Module {...{
                        fieldID,
                        onDragStart:()=>onDragStart(i),
                        onDragEnter:()=>onDragEnter(i),
                        dragStart:(x:number,y:number)=>dragStart(x,y,i),
                        dragMove,
                        dragEnd,
                        handleMouseDown:(x:number,y:number)=>handleMouseDown(x,y,i),
                    }} key={fieldID} />
                ))}
            </Stack>
        )
    }),
    Module = memo((
        {
            fieldID,
            onDragStart,
            onDragEnter,
            dragStart,
            dragMove,
            dragEnd,
            handleMouseDown,
        }:{
            fieldID:EntityId;
            onDragStart:()=>void;
            onDragEnter:()=>void;
            dragStart:(x:number,y:number)=>void;
            dragMove:(x:number,y:number)=>void;
            dragEnd:()=>void;
            handleMouseDown:(x:number,y:number)=>void;
        }
    ) => {
        const 
            fieldName = useAppSelector(state => taskFieldSelector.selectById(state,fieldID)?.fieldName || ''),
            fieldType = useAppSelector(state => taskFieldSelector.selectById(state,fieldID)?.fieldType || ''),
            expanded = useAppSelector(state => taskFieldSelector.selectById(state,fieldID)?.detailsSidebarExpand || false),
            dispatch = useAppDispatch(),
            {palette:{grey}} = useTheme(),
            store = useStore(),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            idb = useRef<IndexedDB>(),
            expandOnChange = () => {
                const state = store.getState() as ReduxState
                layoutOrderDispatch({
                    payload:taskFieldSelector.selectAll(state)
                        .filter(e=>e.fieldType!=='order_in_board_column')
                        .map(e=>({
                            listWideScreenOrder:e.listWideScreenOrder,
                            listNarrowScreenOrder:e.listNarrowScreenOrder,
                            detailsSidebarOrder:e.detailsSidebarOrder,
                            detailsSidebarExpand:e.id===fieldID ? !e.detailsSidebarExpand : e.detailsSidebarExpand,
                            id:e.id
                        }))
                })
                const updates = [{id:fieldID,changes:{detailsSidebarExpand:!expanded}}]
                dispatch(taskEditMultipleFields(updates))
                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
            },
            router = useRouter(),
            taskID = router.query.taskid as string,
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (state:ReduxState)=>taskFieldSelector.selectById(state,fieldID),
                (state:ReduxState)=>state.misc.uid,
                (t:Task,fieldObj:TaskField,uid:EntityId)=>{
                    if (!t || !fieldObj) return false
                    if (!!fieldObj.details) return true
                    if (fieldObj.fieldType==='timer' && (!t.trackTime || ![...t.supervisors,...t.participants,t.owner,t.assignee].includes(uid))) return false
                    return true
                }
            ),[fieldID,taskID]),
            visible = useAppSelector(state => visibilitySelector(state)),
            onTouchStart = (e:TouchEvent<HTMLTableCellElement>) => {
                e.preventDefault()
                e.stopPropagation()
                if (e.touches.length !== 1) return
                const f = e.touches[0]
                dragStart(f.pageX,f.pageY)
            },
            onTouchMove = (e:TouchEvent<HTMLTableCellElement>) => {
                e.preventDefault()
                e.stopPropagation()
                const f = e.touches[0]
                dragMove(f.pageX,f.pageY)
            },
            onMouseStart = (e:ReactMouseEvent<HTMLTableCellElement>) => handleMouseDown(e.pageX,e.pageY)

        useEffect(()=>{
            const state = store.getState() as ReduxState
            idb.current = new IndexedDB(state.misc.uid.toString(),1)
        },[])
    
        if (visible && fieldType==='checkbox') return <CheckboxElem {...{fieldName,fieldID,onDragEnter,onDragStart}} />
        
        if (visible) return (
            <Accordion
                disableGutters
                expanded={expanded}
                onChange={expandOnChange}
                id={getTaskDetailsSidebarModuleID(fieldID)}
                sx={{borderRadius:1}}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreRoundedIcon htmlColor={grey[500]} />}
                    sx={{
                        minHeight:'unset',
                        '& .MuiAccordionSummary-content':{
                            my:0
                        },
                        pl:0,
                        pr:1
                    }}
                >
                    <Table>
                        <TableBody>
                            <TableRow sx={{'.MuiTableCell-root':{p:0,border:'none',py:1}}}>
                                <TableCell 
                                    sx={{width:0,cursor:'move'}} 
                                    onTouchStart={onTouchStart}
                                    onTouchMove={onTouchMove}
                                    onTouchEnd={dragEnd}
                                    onTouchCancel={dragEnd}
                                    onMouseDown={onMouseStart}
                                >
                                    <Box sx={{display:'flex',justifyContent:'center'}}>
                                        <DragIndicatorIcon fontSize="small" sx={{mx:1}} htmlColor={grey[500]} />
                                    </Box>
                                </TableCell>
                                <TableCell sx={{width:'100%'}}>
                                    <Typography sx={sideBarHeadStyle}>{fieldName}</Typography>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </AccordionSummary>
                <AccordionDetails
                    sx={{
                        p:0,
                    }}
                >
                    {fieldType==='single_person' && <SinglePerson {...{fieldID}} />}
                    {fieldType==='timer' && <Timer />}
                    {fieldType==='parents' && <Parent />}
                    {fieldType==='files' && <Files />}
                    {fieldType==='approval' && <Approval />}
                    {fieldType==='date' && <DateElem {...{fieldID}} />}
                    {fieldType==='short_text' && <ShortText {...{fieldID}} />}
                    {['board_column','dropdown'].includes(fieldType.toString()) && <Dropdown {...{fieldID}} />}
                    {fieldType==='link' && <LinkElem {...{fieldID}} />}
                    {fieldType==='number' && <NumberElem {...{fieldID}} />}
                    {fieldType==='tags' && <Tags {...{fieldID}} />}
                    {fieldType==='people' && <People {...{fieldID}} />}
                </AccordionDetails>
            </Accordion>
        )
        else return <></>
    })

Sidebar.displayName = 'Sidebar'
Module.displayName = 'Module'
export default Sidebar