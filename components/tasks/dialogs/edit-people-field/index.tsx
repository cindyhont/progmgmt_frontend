import React, { ChangeEvent, createContext, Dispatch, memo, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { ReduxState, useAppDispatch, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import { taskCustomFieldTypesSelector, taskSelector, taskEditSingleField, taskFieldSelector } from '@components/tasks/reducers/slice'
import { addAction, deleteAction, Iaction, reducer, setAllAction } from "./reducer";
import { useStore } from "react-redux";
import { userDetailsSelector } from "@reducers/user-details/slice";
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import userDetailsApi from "@reducers/user-details/api";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import { AutocompleteUserOption } from "@components/common-components";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import Button from "@mui/material/Button";
import taskApi from "@components/tasks/reducers/api";

const
    Context = createContext<{peopleDialogDispatch:Dispatch<Iaction>}>({peopleDialogDispatch:()=>{}}),
    EditPeopleFieldDialog = memo(()=>{
        const 
            validitySelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState)=>state.taskMgmt.ctxMenuTaskID,
                (state:ReduxState)=>state.taskMgmt.editField,
                (state:ReduxState,field:EntityId,taskID:EntityId,editModeOn:boolean) => {
                    const allPeopleFields = taskFieldSelector.selectAll(state).filter(e=>e.fieldType==='people').map(({id})=>id)
                    return !!field && !!taskID && !!allPeopleFields.length && editModeOn && allPeopleFields.includes(field)
                }
            ),[]),
            editModeOn = useAppSelector(state => validitySelector(state)),
            fieldNameSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>state.taskMgmt.ctxMenuFieldID,
                (state:ReduxState,field:EntityId)=>taskFieldSelector.selectById(state,field)?.fieldName || ''
            ),[]),
            fieldName = useAppSelector(state=>fieldNameSelector(state)),
            [state,peopleDialogDispatch] = useReducer(reducer,{ids:[]}),
            store = useStore(),
            updateIDs = () => {
                const 
                    reduxState = store.getState() as ReduxState,
                    taskID = reduxState.taskMgmt.ctxMenuTaskID,
                    task = taskSelector.selectById(reduxState,taskID),
                    field = reduxState.taskMgmt.ctxMenuFieldID,
                    userIDs = (task[field] as EntityId[]).filter(userID => !!userDetailsSelector.selectById(reduxState,userID))

                peopleDialogDispatch(setAllAction(userIDs))
            },
            dispatch = useAppDispatch(),
            onClose = useCallback(()=>dispatch(taskEditSingleField(false)),[]),
            submitOnClick = () => {
                const 
                    reduxState = store.getState() as ReduxState,
                    taskID = reduxState.taskMgmt.ctxMenuTaskID,
                    field = reduxState.taskMgmt.ctxMenuFieldID
                dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id:taskID,field,value:state.ids}))
                onClose()
            }

        useEffect(()=>{
            if (editModeOn) updateIDs()
        },[editModeOn])

        return (
            <Dialog open={editModeOn} onClose={onClose} keepMounted>
                <DialogTitle>Edit {fieldName}</DialogTitle>
                <DialogContent>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{py:1,px:0,backgroundColor:'transparent',border:'none'}} colSpan={3}>
                                    <Context.Provider value={{peopleDialogDispatch}}>
                                        <SearchField userIDs={state.ids} />
                                    </Context.Provider>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                        <Context.Provider value={{peopleDialogDispatch}}>
                            <TableBody sx={{'.MuiTableCell-root':{py:1,px:0}}}>
                                {state.ids.length===0 && <EmptyList />}
                                {state.ids.map(id=>(
                                    <ReadWriteRow {...{id}} key={id} />
                                ))}
                            </TableBody>
                        </Context.Provider>
                    </Table>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Close</Button>
                    <Button onClick={submitOnClick}>Update</Button>
                </DialogActions>
            </Dialog>
        )
    }),
    SearchField = (
        {
            userIDs
        }:{
            userIDs:EntityId[];
        }
    ) => {
        const
            [options,setOptions] = useState<string[]>([]),
            dispatch = useAppDispatch(),
            autoCompleteRef = useRef<HTMLDivElement>(),
            {peopleDialogDispatch} = useContext(Context),
            onChange = (
                e:ChangeEvent<HTMLInputElement>,
                v:string
            ) => {
                e.preventDefault()
                peopleDialogDispatch(addAction(v))
            },
            onInputChange = async(_:ChangeEvent<HTMLInputElement>,v:string) => {
                const elem = autoCompleteRef.current.getElementsByTagName('input')[0]
                if (v !== elem.value) elem.value = ''
                
                if (v==='') {
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
            }
        return (
            <Autocomplete
                ref={autoCompleteRef}
                renderInput={(params) => (
                    <TextField
                        inputRef={params.InputProps.ref}
                        {...params}
                        label="Add users"
                    />
                )}
                value={null}
                options={options}
                onChange={onChange}
                disableClearable
                onInputChange={onInputChange}
                getOptionLabel={(opt:string)=>!!opt ? opt : ''}
                filterSelectedOptions
                filterOptions={(x) => x}
                blurOnSelect
                isOptionEqualToValue={(opt,val)=>!!opt && !!val && opt===val}
                forcePopupIcon={false}
                renderOption={(prop,opt)=>(!!opt ? <AutocompleteUserOption {...{...prop,uid:opt}} /> : <></>)}
            />
        )
    },
    EmptyList = () => (
        <TableRow>
            <TableCell sx={{border:'none',textAlign:'center',height:100,fontSize:'1rem'}}>
                No user in the list.
            </TableCell>
        </TableRow>
    ),
    ReadWriteRow = ({id}:{id:EntityId}) => {
        const
            {peopleDialogDispatch} = useContext(Context),
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,id).avatar),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,id).firstName),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,id).lastName),
            crossOnClick = () => peopleDialogDispatch(deleteAction(id))

        return (
            <TableRow>
                <TableCell sx={{width:0}}>
                    <Avatar src={avatar} sx={{mr:1}} />
                </TableCell>
                <TableCell>{`${firstName} ${lastName}`.trim()}</TableCell>
                <TableCell sx={{width:0}}>
                    <IconButton onClick={crossOnClick} color='error'>
                        <CloseRoundedIcon />
                    </IconButton>
                </TableCell>
            </TableRow>
        )
    }
EditPeopleFieldDialog.displayName = 'EditPeopleFieldDialog'
export default EditPeopleFieldDialog