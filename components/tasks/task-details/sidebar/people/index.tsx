import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { userDetailsSelector } from "@reducers/user-details/slice";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { ChangeEvent, HTMLAttributes, memo, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';
import { grey } from '@mui/material/colors';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { taskFieldSelector, taskSelector } from "@components/tasks/reducers/slice";
import SimpleTextDisplay from "../simple-text-display";
import { addAction, deleteAction, reducer, setAllAction } from "./reducer";
import { AutocompleteUserOption } from "@components/common-components";
import userDetailsApi from "@reducers/user-details/api";
import { useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { useRouter } from "next/router";
import { useStore } from "react-redux";

const
    groupUserKeysNoViewers = ['supervisors','participants'],
    groupUserKeys = [...groupUserKeysNoViewers,'viewers'],
    People = memo(({fieldID}:{fieldID:EntityId})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            fieldName = useAppSelector(state => taskFieldSelector.selectById(state,fieldID)?.fieldName || ''),
            userIDsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const 
                        field = taskFieldSelector.selectById(state,fieldID),
                        task = taskSelector.selectById(state,taskID)
                    if (!field.details) return task[fieldID] as EntityId[]

                    let idsToFilter = [task.owner]

                    for (let i in groupUserKeys){
                        const fieldItem = task[i] as EntityId[]
                        if (fieldID===i) return fieldItem.filter(e=>idsToFilter.includes(e))
                        idsToFilter = [...idsToFilter,...fieldItem]
                    }
                },
            ),[fieldID,taskID]),
            userIDs = useAppSelector(state => userIDsSelector(state)),
            editRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const field = taskFieldSelector.selectById(state,fieldID)
                    if (!!field.details) return true

                    const 
                        task = taskSelector.selectById(state,taskID),
                        uid = state.misc.uid

                    if ([...task.supervisors,task.owner].includes(uid)) return true
                    else if (fieldID==='assignee' && task.assignee===uid) return true
                    else if ((['participants','viewers'] as EntityId[]).includes(fieldID) && task.participants.includes(uid)) return true
                    else if (fieldID==='viewers' && task.viewers.includes(uid)) return true
                    
                    else return false
                }
            ),[fieldID,taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            [editMode,setEditMode] = useState(false),
            [peopleState,peopleDispatch] = useReducer(reducer,{list:[]}),
            deleteUser = useCallback((userID:EntityId)=>peopleDispatch(deleteAction(userID)),[]),
            editModeOff = () => setEditMode(false),
            editModeOn = () => setEditMode(true),
            updateUser = useCallback((userID:EntityId)=>peopleDispatch(addAction(userID)),[]),
            [updateField] = useTaskUpdateOneFieldMutation(),
            store = useStore(),
            okOnClick = () =>{
                const 
                    state = store.getState() as ReduxState,
                    task = taskSelector.selectById(state,taskID),
                    value = task[fieldID] as EntityId[]
                if (peopleState.list.length===value.length && peopleState.list.every(e=>value.includes(e))) {
                    editModeOff()
                    return
                }

                let canAddUser = false
                const 
                    field = taskFieldSelector.selectById(state,fieldID),
                    uid = state.misc.uid

                if (!field) return
                else if (!!field.details) canAddUser = true
                else if ([...task.supervisors,task.owner].includes(uid)) canAddUser = true
                else if (fieldID==='assignee' && task.assignee===uid) canAddUser = true
                else if ((['participants','viewers'] as EntityId[]).includes(fieldID) && task.participants.includes(uid)) canAddUser = true

                updateField({
                    id:taskID,
                    field:fieldID,
                    value:canAddUser ? peopleState.list : peopleState.list.filter(e=>task[fieldID].includes(e))
                })
                editModeOff()
            }

        useEffect(()=>{
            if (!hasEditRight) setEditMode(false)
        },[hasEditRight])

        useEffect(()=>{
            peopleDispatch(setAllAction(userIDs))
        },[])

        useEffect(()=>{
            if (!editMode) peopleDispatch(setAllAction(userIDs))
        },[editMode,userIDs])

        return (
            <Stack direction='column' spacing={editMode ? 2 : !!peopleState.list.length ? 1 : 0} sx={{px:1.5,pb:1.5}}>
                <Table
                    sx={{
                        '.MuiTableCell-root':{
                            border:'none',
                            p:0,
                        },
                    }}
                >
                    <TableBody>
                        {peopleState.list.length !== 0 && peopleState.list.map(userID=>(
                            <Row key={userID} {...{
                                userID,
                                fieldID,
                                showDeleteButton:editMode,
                                onDelete:()=>deleteUser(userID)
                            }} />
                        ))}
                        {!editMode && peopleState.list.length === 0 && <TableRow><SimpleTextDisplay {...{content:'N/A',nilTextColor:true}} /></TableRow>}
                    </TableBody>
                </Table>
                {hasEditRight && !editMode && <Button 
                    endIcon={!!peopleState.list.length ? <EditRoundedIcon /> : <AddRoundedIcon />}
                    variant='outlined'
                    onClick={editModeOn}
                >
                    <Typography sx={{fontSize:'0.8rem'}}>{!!peopleState.list.length ? 'Edit' : 'Add'} {fieldName}</Typography>
                </Button>}
                {editMode && <Editor {...{userIDs:peopleState.list,updateUser,editModeOff,okOnClick,peopleElem:true,fieldID}} />}
            </Stack>
        )
    }),
    SinglePerson = memo(({fieldID}:{fieldID:EntityId})=>{
        const
            router = useRouter(),
            taskID = router.query.taskid as string,
            [userID,setUserID] = useState<EntityId>(''),
            updateUser = useCallback((v:EntityId)=>setUserID(v),[]),
            fieldName = useAppSelector(state => taskFieldSelector.selectById(state,fieldID)?.fieldName || ''),
            userIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const task = taskSelector.selectById(state,taskID)
                    return task[fieldID] as EntityId || ''
                }
            ),[fieldID,taskID]),
            userIdInStore = useAppSelector(state => userIdSelector(state)),
            editRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const field = taskFieldSelector.selectById(state,fieldID)
                    if (!!field.details) return true
                    const 
                        uid = state.misc.uid,
                        task = taskSelector.selectById(state,taskID),
                        withAllRights = [task.owner,...task.supervisors]

                    if (fieldID==='assignee') return [...withAllRights,task.assignee].includes(uid)
                    return withAllRights.includes(uid)
                }
            ),[fieldID,taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            [editMode,setEditMode] = useState(false),
            editModeOn = () => setEditMode(true),
            editModeOff = useCallback(()=>setEditMode(false),[]),
            [updateField] = useTaskUpdateOneFieldMutation(),
            okOnClick = useCallback(() => {
                if (userID!==userIdInStore) updateField({
                    id:taskID,
                    field:fieldID,
                    value:userID
                })
                editModeOff()
            },[fieldID,userID,userIdInStore])

        useEffect(()=>{
            if (!editMode) setUserID(userIdInStore)
        },[editMode,userIdInStore])

        useEffect(()=>{
            if (!hasEditRight) setEditMode(false)
        },[hasEditRight])

        return (
            <Stack direction='column' spacing={1} sx={{px:1.5,pb:1.5}}>
                <Table
                    sx={{
                        '.MuiTableCell-root':{
                            border:'none',
                            p:0,
                        },
                    }}
                >
                    <TableBody>
                        <Row {...{userID,fieldID,showDeleteButton:false,onDelete:()=>{}}} />
                    </TableBody>
                </Table>
                {hasEditRight && !editMode && <Button 
                    endIcon={<EditRoundedIcon />}
                    variant='outlined'
                    onClick={editModeOn}
                >
                    <Typography sx={{fontSize:'0.8rem'}}>Edit {fieldName}</Typography>
                </Button>}
                {editMode && <Editor {...{
                    fieldID,
                    userIDs:[userID],
                    peopleElem:false,
                    editModeOff,
                    updateUser,
                    okOnClick,
                }} />}
            </Stack>
        )
    }),
    Editor = memo((
        {
            fieldID,
            userIDs,
            updateUser,
            editModeOff,
            okOnClick,
            peopleElem,
        }:{
            fieldID:EntityId;
            userIDs:EntityId[];
            updateUser:(userID:EntityId)=>void;
            editModeOff:()=>void;
            okOnClick:()=>void;
            peopleElem:boolean;
        }
    )=>{
        const
            [options,setOptions] = useState<EntityId[]>([]),
            [inputValue,setInputValue] = useState(''),
            ref = useRef<HTMLInputElement>(),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:EntityId
            ) => {
                e.preventDefault()
                updateUser(v)
                setInputValue('')
            },
            dispatch = useAppDispatch(),
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                setInputValue(v)
                if (v.trim()==='') {
                    setOptions([])
                    return
                }

                try {
                    const 
                        result = await dispatch(
                            userDetailsApi.endpoints.searchUser.initiate({query:v,exclude:userIDs})
                        ).unwrap()
                    setOptions([...result])
                } catch (error) {
                    console.log(error)
                }
            },
            taskID = useRouter().query.taskid as string,
            showInputSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const field = taskFieldSelector.selectById(state,fieldID)
                    if (!!field.details) return true

                    const 
                        task = taskSelector.selectById(state,taskID),
                        uid = state.misc.uid

                    if ([...task.supervisors,task.owner].includes(uid)) return true
                    else if (fieldID==='assignee' && task.assignee===uid) return true
                    else if ((['participants','viewers'] as EntityId[]).includes(fieldID) && task.participants.includes(uid)) return true
                    // else if (fieldID==='viewers' && task.viewers.includes(uid)) return true
                    
                    else return false
                }
            ),[fieldID,taskID]),
            showInput = useAppSelector(state => showInputSelector(state))

        useEffect(()=>{
            if (!!ref.current) ref.current.focus()
        },[])

        return (
            <>
            {showInput && <Autocomplete 
                fullWidth
                disablePortal
                options={options}
                onChange={onChange}
                onInputChange={onInputChange}
                disableClearable
                forcePopupIcon={false}
                inputValue={inputValue}
                value={null}
                filterOptions={x => x}
                renderInput={params => (<TextField {...params} inputRef={ref} label={`${peopleElem ? 'Add' : 'Update'} user...`} />)}
                renderOption={(prop:HTMLAttributes<HTMLLIElement>,opt:EntityId)=>!!opt ? <AutocompleteUserOption {...{...prop,uid:opt.toString()}} /> : <></>}
            />}
            <Grid container direction='row' sx={{justifyContent:'space-between','button':{fontSize:'0.8rem'}}}>
                <Button variant="outlined" onClick={editModeOff}>Cancel</Button>
                <Button variant="contained" onClick={okOnClick}>OK</Button>
            </Grid>
            </>
        )
    }),
    Row = memo((
        {
            fieldID,
            userID,
            showDeleteButton,
            onDelete
        }:{
            fieldID:EntityId;
            userID:EntityId;
            showDeleteButton:boolean;
            onDelete:()=>void;
        }
    )=>{
        const 
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,userID)?.avatar || ''),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,userID)?.lastName || ''),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,userID)?.firstName || ''),
            handleDelete = () => {
                if (showDeleteButton) onDelete()
            },
            taskID = useRouter().query.taskid as string,
            canShowDeleteButtonSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    if (!showDeleteButton) return false
                    const field = taskFieldSelector.selectById(state,fieldID)
                    if (!!field.details) return true

                    const 
                        task = taskSelector.selectById(state,taskID),
                        uid = state.misc.uid

                    if ([...task.supervisors,task.owner].includes(uid)) return true
                    else if (fieldID==='assignee' && task.assignee===uid) return true
                    else if ((['participants','viewers'] as EntityId[]).includes(fieldID) && task.participants.includes(uid)) return true
                    else if (fieldID==='viewers' && task.viewers.includes(uid)) return userID===uid
                    
                    return false
                }
            ),[taskID,fieldID,showDeleteButton,userID]),
            canShowDeleteButton = useAppSelector(state => canShowDeleteButtonSelector(state))

        return (
            <TableRow>
                <TableCell sx={{width:0}}>
                    <Avatar src={avatar} sx={{mr:1,width:30,height:30,my:0.5}} />
                </TableCell>
                <TableCell colSpan={canShowDeleteButton ? 1 : 2} sx={{width:'100%'}}>
                    <Typography variant='body2'>{`${firstName} ${lastName}`.trim()}</Typography>
                </TableCell>
                {canShowDeleteButton && <TableCell sx={{width:0}}>
                    <IconButton onClick={handleDelete} sx={{ml:1,mr:-1.5,my:0.5,visibility:showDeleteButton ? 'visible' : 'hidden'}}>
                        <ClearRoundedIcon htmlColor={grey[500]} />
                    </IconButton>    
                </TableCell>}
            </TableRow>
        )
    })
People.displayName = 'People'
SinglePerson.displayName = 'SinglePerson'
Editor.displayName = 'Editor'
Row.displayName = 'Row'
export { People, SinglePerson }