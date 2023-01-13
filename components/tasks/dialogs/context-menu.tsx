import React, { memo, useContext, useEffect, useMemo, useRef } from "react";
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers'
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import { addTaskAction, toggleDialogAction } from "../reducers/dialog-ctxmenu-status";
import { useStore } from "react-redux";
import { taskCustomFieldTypesSelector, taskEditMultipleFields, taskEditSingleField, taskFieldSelector, taskSelector, taskUpdateOne } from "../reducers/slice";
import { createSelector, EntityId, Update } from "@reduxjs/toolkit";
import { TaskEdit } from "./add-edit-task/reducer";
import dayjs from "dayjs";
import taskApi from "../reducers/api";
import { useTheme } from '@mui/material/styles';
import { DialogCtxMenuDispatchContext } from "../contexts";
import IndexedDB from "@indexeddb";
import { getSortedFieldIDs } from "@indexeddb/functions";
import { Task, TaskField } from "../interfaces";
import { LayoutOrderDispatchContext } from "@pages";
import { useRouter } from "next/router";
import useNarrowBody from "hooks/theme/narrow-body";

const 
    ContextMenu = memo((
        {
            open,
            anchorPosition,
        }:{
            open:boolean;
            anchorPosition:{left:number;top:number;};
        }
    )=>{
        const 
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))

        return (
            <Menu 
                open={open}
                onClose={onClose}
                anchorReference="anchorPosition"
                anchorPosition={anchorPosition}
                keepMounted
            >
                <EditTaskField />
                <HideColumn />
                <ConfigureColumn />
                <DuplicateTask />
                <RenameBoardColumn />
                <SetDefaultBoardColumn />
                <DeleteBoardColumn />
                <RemoveTaskFile />
                <DeleteField />
                <DeleteTask />
            </Menu>
        )
    }),
    EditTaskField = memo(()=>{
        const 
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (state:ReduxState)=>state.misc.uid,
                (state:ReduxState,field:EntityId,taskID:EntityId,uid:EntityId)=>{
                    if (!field || !taskID || (['createDT','owner','creator'] as EntityId[]).includes(field)) return false

                    const fieldObj = taskFieldSelector.selectById(state,field)
                    if (!fieldObj) return false
                    const 
                        {fieldType} = fieldObj,
                        fieldTypeObj = taskCustomFieldTypesSelector.selectById(state,fieldType)
                    if (!fieldTypeObj.editInListView) return false
                    if (!!fieldObj.details) return true

                    const task = taskSelector.selectById(state,taskID)
                    if (!task) return false
                    const users = [...task.supervisors,task.owner]
                    return (field==='assignee' ? [...users,task.assignee] : users).includes(uid)
                }
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            dispatch = useAppDispatch(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                if (!display) return
                dispatch(taskEditSingleField(true))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Edit Value</ListItemText>
            </MenuItem>
        )
    }),
    HideColumn = memo(()=>{
        const
            idb = useRef<IndexedDB>(),
            narrowBody = useNarrowBody(),
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state,
                (field:EntityId,state:ReduxState)=>{
                    const key = narrowBody ? 'listNarrowScreenOrder' : 'listWideScreenOrder'
                    if (!field || field==='name') return false
                    const f = taskFieldSelector.selectById(state,field)
                    return !!f && f[key] !== -1
                }
            ),[narrowBody]),
            display = useAppSelector(state => visibilitySelector(state)),
            dispatch = useAppDispatch(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            store = useStore(),
            {layoutOrderDispatch} = useContext(LayoutOrderDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                if (!display) return

                const 
                    state = store.getState() as ReduxState,
                    ctxMenuFieldID = state.taskMgmt.ctxMenuFieldID,
                    key = narrowBody ? 'listNarrowScreenOrder' : 'listWideScreenOrder',
                    fields = taskFieldSelector.selectAll(state),
                    fieldCount = fields.length,
                    filteredFields = fields.filter(e=>e.id!==ctxMenuFieldID),
                    filteredFieldIDs = getSortedFieldIDs(filteredFields,key)

                let updates:Update<TaskField>[] = []

                for (let i=0; i<fieldCount; i++){
                    const 
                        field = fields[i],
                        {id} = field,
                        newPos = filteredFieldIDs.indexOf(id)
                    if (field[key]!==newPos) updates.push({id,changes:{[key]:newPos}})
                }

                if (!updates.length) return

                idb.current.updateMultipleEntries(idb.current.storeNames.taskFields,updates)
                dispatch(taskEditMultipleFields(updates))

                layoutOrderDispatch({
                    payload:fields.map((
                        {
                            id,
                            listWideScreenOrder,
                            listNarrowScreenOrder,
                            detailsSidebarOrder,
                            detailsSidebarExpand,
                        }
                    )=>({
                        id,
                        listWideScreenOrder:narrowBody ? listWideScreenOrder : filteredFieldIDs.indexOf(id),
                        listNarrowScreenOrder:narrowBody ? filteredFieldIDs.indexOf(id) : listNarrowScreenOrder,
                        detailsSidebarOrder,
                        detailsSidebarExpand,
                    }))
                })
            }

        useEffect(()=>{
            const state = store.getState() as ReduxState
            idb.current = new IndexedDB(state.misc.uid.toString(),1)
        },[])

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Hide Column</ListItemText>
            </MenuItem>
        )
    }),
    ConfigureColumn = memo(()=>{
        const
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>Object.values(state.taskMgmt.fields.entities).filter(e=>!!e.details).map(({id})=>id).includes(state.taskMgmt.ctxMenuFieldID),
                (isCustomField:boolean)=>isCustomField
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                if (!display) return
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'editCustomField',open:true}))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Configure Column</ListItemText>
            </MenuItem>
        )
    }),
    DuplicateTask = memo(()=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (ctxMenuTaskID:EntityId)=>!!ctxMenuTaskID && !taskID
            ),[taskID]),
            display = useAppSelector(state => visibilitySelector(state)),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            store = useStore(),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                if (!display) return

                const
                    state = store.getState() as ReduxState,
                    taskID = state.taskMgmt.ctxMenuTaskID,
                    t = taskSelector.selectById(state,taskID)

                if (!t) return

                const
                    taskEdit:TaskEdit = {
                        ...t,
                        withTimeFrame:!!t.startDT || !!t.deadlineDT,
                        hourlyRate_edit:t.hourlyRate.toString(),
                        startDT_edit:!!t.startDT ? dayjs(t.startDT) : null,
                        deadlineDT_edit:!!t.deadlineDT ? dayjs(t.deadlineDT) : null,
                        hasFiles:t.fileIDs.length!==0,
                        parent:t.parents[t.parents.length-1].toString(),
                        files:[],
                        assignee:t.assignee
                    }
                
                dialogCtxMenuStatusDispatch(addTaskAction(taskEdit))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Duplicate Task</ListItemText>
            </MenuItem>
        )
    }),
    RenameBoardColumn = memo(()=>{
        const
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuBoardColumnID,
                (boardColumnID:EntityId)=> !!boardColumnID
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                if (!display) return

                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'renameBoardColumn',open:true}))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Rename Column</ListItemText>
            </MenuItem>
        )
    }),
    SetDefaultBoardColumn = memo(()=>{
        const
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuBoardColumnID,
                (boardColumnID:EntityId)=> !!boardColumnID
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            store = useStore(),
            dispatch = useAppDispatch(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                const
                    state = store.getState() as ReduxState,
                    defaultBoardColumnID = state.taskMgmt.ctxMenuBoardColumnID,
                    boardColumnType = 'board_column',
                    boardColumnFieldObj = taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column')

                dispatch(taskApi.endpoints.taskEditCustomField.initiate({
                    id:boardColumnFieldObj.id,
                    f:{
                        name:boardColumnFieldObj.fieldName,
                        fieldType:boardColumnType,
                        defaultValues:{[boardColumnType]:defaultBoardColumnID},
                        options:{[boardColumnType]:boardColumnFieldObj.details.options}
                    }
                }))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText>Set as Default Column</ListItemText>
            </MenuItem>
        )
    }),
    DeleteBoardColumn = memo(()=>{
        const
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuBoardColumnID,
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column')?.details?.options || [],
                (boardColumnID:EntityId,columnOptions:any[]) => !!boardColumnID && columnOptions.length > 1
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            theme = useTheme(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteBoardColumn',open:true}))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText sx={{color:theme.palette.error[theme.palette.mode]}}>Delete Column</ListItemText>
            </MenuItem>
        )
    }),
    RemoveTaskFile = memo(()=>{
        const 
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFileID,
                (taskID:EntityId,fileID:EntityId)=> !!taskID && !!fileID
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            theme = useTheme(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            store = useStore(),
            dispatch = useAppDispatch(),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                const state = store.getState() as ReduxState
                dispatch(taskUpdateOne({
                    id:state.taskMgmt.ctxMenuTaskID,
                    changes:{
                        filesToDelete:[...taskSelector.selectById(state,state.taskMgmt.ctxMenuTaskID).filesToDelete,state.taskMgmt.ctxMenuFileID]
                    }
                }))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText sx={{color:theme.palette.error.main}}>Delete File</ListItemText>
            </MenuItem>
        )
    }),
    DeleteField = memo(()=>{
        const 
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskFieldSelector.selectById(state,state.taskMgmt.ctxMenuFieldID),
                (fieldObj:TaskField)=>!!fieldObj && !!fieldObj.details
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            {palette:{error}} = useTheme(),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteField',open:true}))
            }

        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText sx={{color:error.main}}>Delete Field</ListItemText>
            </MenuItem>
        )
    }),
    DeleteTask = memo(()=>{
        const
            {palette:{error}} = useTheme(),
            visibilitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,state.taskMgmt.ctxMenuTaskID),
                (state:ReduxState)=>state.misc.uid,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFileID,
                (task:Task,uid:EntityId,fileID:EntityId)=>{
                    if (!task || !!fileID) return false
                    return [...task.supervisors,task.owner].includes(uid)
                }
            ),[]),
            display = useAppSelector(state => visibilitySelector(state)),
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClick = () => {
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'contextMenu',open:false}))
                dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteTask',open:true}))
            }
        
        return (
            <MenuItem sx={{display:display ? 'flex' : 'none'}} onClick={onClick}>
                <ListItemText sx={{color:error.main}}>Delete Task</ListItemText>
            </MenuItem>
        )
    })

ContextMenu.displayName = 'ContextMenu'
EditTaskField.displayName = 'EditTaskField'
HideColumn.displayName = 'HideColumn'
ConfigureColumn.displayName = 'ConfigureColumn'
DuplicateTask.displayName = 'DuplicateTask'
RenameBoardColumn.displayName = 'RenameBoardColumn'
SetDefaultBoardColumn.displayName = 'SetDefaultBoardColumn'
DeleteBoardColumn.displayName = 'DeleteBoardColumn'
RemoveTaskFile.displayName = 'RemoveTaskFile'
DeleteField.displayName = 'DeleteField'
DeleteTask.displayName = 'DeleteTask'
export default ContextMenu