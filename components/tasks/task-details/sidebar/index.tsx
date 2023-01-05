import React, { memo, MouseEvent as ReactMouseEvent, TouchEvent, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Stack from '@mui/material/Stack'
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { grey } from '@mui/material/colors';
import { createSelector, EntityId, Update } from "@reduxjs/toolkit";
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Typography from '@mui/material/Typography'
import { getSortedFieldIDs } from "@indexeddb/functions";
import { useStore } from "react-redux";
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box'
import { useTheme } from "@mui/material";
import { taskCustomFieldTypesSelector, taskEditMultipleFields, taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import { Task, TaskField } from "@components/tasks/interfaces";
import { initialState, movingAction, reducer, setAllAction, startMovingAction } from "./reducer";
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
            [dragHasFiles,setDragHasFiles] = useState(false),
            fieldsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectAll(state).filter(e=>{
                    const type = taskCustomFieldTypesSelector.selectById(state,e.fieldType)
                    return !!type && type?.taskDetailsSidebar
                }),
                (f:TaskField[])=>getSortedFieldIDs(f,'detailsSidebarOrder')
            ),[]),
            fields = useAppSelector(state => fieldsSelector(state)),
            [sidebarState,sidebarDispatch] = useReducer(reducer,initialState),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            store = useStore(),
            idb = useRef<IndexedDB>(),
            initState = () => {
                const
                    state = store.getState() as ReduxState,
                    fields = fieldsSelector(state)
                sidebarDispatch(setAllAction(fields))
            },
            onDragStart = useCallback((idx:number) => sidebarDispatch(startMovingAction(sidebarState.fields[idx])),[sidebarState.fields]),
            onDragEnter = useCallback((idx:number) => {
                if (!dragHasFiles) sidebarDispatch(movingAction(idx))
            },[dragHasFiles]),
            handleDragOver = (e:DragEvent) => setDragHasFiles(e.dataTransfer.types.includes('Files')),
            startingPoint = useRef({touchX:-1,touchY:-1,rectLeft:-1,rectTop:-1}),
            clonedElem = useRef<HTMLElement>(null),
            moduleMoving = useRef(false),
            handleTouchStart = (x:number,y:number,i:number) => {
                document.body.style.overscrollBehavior = 'none'
                const 
                    originalModule = document.getElementById(getTaskDetailsSidebarModuleID(sidebarState.fields[i])),
                    rect = originalModule.getBoundingClientRect()
                startingPoint.current = {touchX:x,touchY:y,rectLeft:rect.left,rectTop:rect.top}
                onDragStart(i)
                clonedElem.current = originalModule.cloneNode(true) as HTMLElement
                clonedElem.current.id = `cloned-${sidebarState.fields[i]}`
                clonedElem.current.style.position = 'fixed'
                clonedElem.current.style.left = `${rect.left}px`
                clonedElem.current.style.top = `${rect.top}px`
                clonedElem.current.style.width = `${rect.width}px`
                clonedElem.current.style.height = `${rect.height}px`
                clonedElem.current.style.opacity = '0.7'
                containerRef.current.appendChild(clonedElem.current)
            },
            dragEnterTimeout = useRef<NodeJS.Timeout>(),
            setDragEnterTimeout = (i:number) => {
                clearTimeout(dragEnterTimeout.current)
                dragEnterTimeout.current = setTimeout(onDragEnter,20,i)
            },
            handleTouchMove = (x:number,y:number)=>{
                moduleMoving.current = true
                clonedElem.current.style.left = `${x - startingPoint.current.touchX + startingPoint.current.rectLeft}px`
                clonedElem.current.style.top = `${y - startingPoint.current.touchY + startingPoint.current.rectTop}px`

                const len = sidebarState.fields.length

                for (let i=0; i<len; i++){
                    const 
                        fieldID = sidebarState.fields[i],
                        mod = document.getElementById(getTaskDetailsSidebarModuleID(fieldID))
                    if (!mod) continue
                    
                    const {top,bottom,left,right} = mod.getBoundingClientRect()
                    if (x>left && x<right && y>top && y<bottom){
                        setDragEnterTimeout(i)
                        break
                    }
                }
            },
            handleTouchEnd = () => {
                document.body.style.overscrollBehavior = null
                if (!!clonedElem.current) {
                    clonedElem.current.remove()
                    clonedElem.current = null
                }
                if (!moduleMoving.current) return
                moduleMoving.current = false
            },
            dispatch = useAppDispatch(),
            updateReduxIDB = () => {
                const 
                    state = store.getState() as ReduxState,
                    fieldsInRedux = taskFieldSelector.selectAll(state).filter(e=>e.fieldType!=='order_in_board_column'),
                    fieldCount = fieldsInRedux.length

                let updates:Update<TaskField>[] = []

                for (let i=0; i<fieldCount; i++){
                    const 
                        field = fieldsInRedux[i],
                        {id} = field,
                        newPos = sidebarState.fields.indexOf(id)
                    if (newPos !== field.detailsSidebarOrder) updates = [...updates,{id,changes:{detailsSidebarOrder:newPos}}]
                }
                if (!updates.length) return

                dispatch(taskEditMultipleFields(updates))
                
                layoutOrderDispatch({
                    payload:fieldsInRedux.map(e=>({
                        listWideScreenOrder:e.listWideScreenOrder,
                        listNarrowScreenOrder:e.listNarrowScreenOrder,
                        detailsSidebarExpand:e.detailsSidebarExpand,
                        detailsSidebarOrder:sidebarState.fields.indexOf(e.id),
                        id:e.id
                    }))
                })

                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
            },
            timer = useRef<NodeJS.Timeout>(),
            tempStateOnChange = () => {
                clearTimeout(timer.current)
                timer.current = setTimeout(updateReduxIDB,500)
            },
            mouseDragging = useRef(false),
            handleMouseDown = (x:number,y:number,i:number) => {
                mouseDragging.current = true
                handleTouchStart(x,y,i)
            },
            onMouseMove = (e:MouseEvent) => {
                if (mouseDragging.current) handleTouchMove(e.pageX,e.pageY)
            },
            onMouseUp = () => {
                mouseDragging.current = false
                handleTouchEnd()
            }

        useEffect(()=>{
            initState()
            const state = store.getState() as ReduxState
            idb.current = new IndexedDB(state.misc.uid.toString(),1)
            window.addEventListener('dragover',handleDragOver,{passive:true})

            return () => {
                window.removeEventListener('dragover',handleDragOver)
            }
        },[])

        useEffect(()=>{
            tempStateOnChange()
            window.addEventListener('mousemove',onMouseMove,{passive:true})
            window.addEventListener('mouseup',onMouseUp,{passive:true})
            return () => {
                window.removeEventListener('mousemove',onMouseMove)
                window.removeEventListener('mouseup',onMouseUp)
            }
        },[sidebarState.fields])

        useEffect(()=>{
            sidebarDispatch(setAllAction(fields))
        },[fields])

        return (
            <Stack 
                direction='column' 
                spacing={2} 
                pb={2}
                ref={containerRef}
            >
                {sidebarState.fields.map((fieldID,i)=>(
                    <Module {...{
                        fieldID,
                        onDragStart:()=>onDragStart(i),
                        onDragEnter:()=>onDragEnter(i),
                        handleTouchStart:(x:number,y:number)=>handleTouchStart(x,y,i),
                        handleTouchMove,
                        handleTouchEnd,
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
            handleTouchStart,
            handleTouchMove,
            handleTouchEnd,
            handleMouseDown,
        }:{
            fieldID:EntityId;
            onDragStart:()=>void;
            onDragEnter:()=>void;
            handleTouchStart:(x:number,y:number)=>void;
            handleTouchMove:(x:number,y:number)=>void;
            handleTouchEnd:()=>void;
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
                if (e.touches.length !== 1) return
                const f = e.touches[0]
                handleTouchStart(f.pageX,f.pageY)
            },
            onTouchMove = (e:TouchEvent<HTMLTableCellElement>) => {
                const f = e.touches[0]
                handleTouchMove(f.pageX,f.pageY)
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
                                    onTouchEnd={handleTouchEnd}
                                    onTouchCancel={handleTouchEnd}
                                    onMouseDown={onMouseStart}
                                >
                                    <Box sx={{display:'flex',justifyContent:'center'}}>
                                        <DragIndicatorIcon fontSize="small" sx={{mx:1}} htmlColor={grey[500]} />
                                    </Box>
                                </TableCell>
                                <TableCell>
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