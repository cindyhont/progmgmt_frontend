import React, { FormEvent, memo, useContext, useEffect, useMemo, useRef, useState } from 'react'
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from "@mui/material/Dialog";
import DialogContentText from '@mui/material/DialogContentText';
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { toggleDialogAction } from '../reducers/dialog-ctxmenu-status';
import { createSelector, EntityId } from '@reduxjs/toolkit';
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers';
import { taskFieldSelector } from '../reducers/slice';
import { Ioption } from '../board';
import { v4 as uuidv4 } from 'uuid'
import taskApi from '../reducers/api';
import { DialogCtxMenuDispatchContext } from '../contexts';

const 
    selectBoardColumnID = (state:ReduxState)=>state.taskMgmt.ctxMenuBoardColumnID,
    selectBoardColumnOptions = (state:ReduxState)=>(
        taskFieldSelector.selectAll(state)
        .find(e=>e.fieldType==='board_column').details.options as Ioption[]
    ).filter(e=>e.id !== state.taskMgmt.ctxMenuBoardColumnID),
    DeleteBoardColumnDialog = memo(({open}:{open:boolean})=>{
        const
            actionLabelID = useRef(uuidv4()).current,
            nextDefaultLabelID = useRef(uuidv4()).current,
            {dialogCtxMenuStatusDispatch} = useContext(DialogCtxMenuDispatchContext),
            onClose = () => dialogCtxMenuStatusDispatch(toggleDialogAction({dialog:'deleteBoardColumn',open:false})),
            columnNameSelector = useMemo(()=>createSelector(
                selectBoardColumnID,
                selectBoardColumnOptions,
                (boardColumnID:EntityId,columnOptions:Ioption[])=>{
                    if (!boardColumnID) return ''
                    const option = columnOptions.find(e=>e.id===boardColumnID)
                    return option?.name || ''
                }
            ),[]),
            columnName = useAppSelector(state => columnNameSelector(state)),
            options = useAppSelector(selectBoardColumnOptions),
            [action,setAction] = useState(options[0].id),
            actionOnChange = (e: SelectChangeEvent) => setAction(e.target.value),
            // {palette:{mode,error}} = useTheme(),
            defaultValueDisplaySelector = useMemo(()=>createSelector(
                selectBoardColumnID,
                (state:ReduxState)=>taskFieldSelector.selectAll(state).find(e=>e.fieldType==='board_column').details.default,
                (boardColumnID:EntityId,defaultValue:EntityId)=> boardColumnID === defaultValue
            ),[]),
            defaultValueDisplay = useAppSelector(state => defaultValueDisplaySelector(state)),
            [nextDefault,setNextDefault] = useState(options[0].id),
            nextDefaultOnChange = (e: SelectChangeEvent) => setNextDefault(e.target.value),
            submitRef = useRef<HTMLInputElement>(),
            submitOnClick = () => submitRef.current.click(),
            dispatch = useAppDispatch(),
            onSubmit = (e:FormEvent) => {
                e.preventDefault()
                onClose()
                dispatch(taskApi.endpoints.taskDeleteBoardColumn.initiate({
                    action,
                    newDefault:nextDefault
                }))
            }

        useEffect(()=>{
            if (open) {
                setAction(options[0].id)
                setNextDefault(options[0].id)
            }
        },[open])

        return (
            <Dialog open={open} onClose={onClose} keepMounted>
                <DialogTitle>Delete Column: <span style={{fontStyle:'italic'}}>{columnName}</span></DialogTitle>
                <DialogContent>
                    <Box component='form' onSubmit={onSubmit}>
                        <Stack sx={{mt:1}} direction='column' spacing={2}>
                            <FormControl fullWidth>
                                <InputLabel id={actionLabelID}>Action to tasks</InputLabel>
                                <Select
                                    labelId={actionLabelID}
                                    label='Action to tasks'
                                    value={action}
                                    onChange={actionOnChange}
                                >
                                    {options.map(({id,name})=>(
                                        <MenuItem key={id} value={id}>Move to <span style={{fontWeight:'bold',marginLeft:'0.3rem'}}>{name}</span></MenuItem>
                                    ))}
                                    {/*<MenuItem value={constants.taskBoardColumnDeleteAllTasksKey}><span style={{color:error[mode]}}>Delete</span></MenuItem>*/}
                                </Select>
                            </FormControl>
                            {defaultValueDisplay && <FormControl fullWidth>
                                <InputLabel id={nextDefaultLabelID}>New default column</InputLabel>
                                <Select
                                    labelId={nextDefaultLabelID}
                                    label='New default column'
                                    value={nextDefault}
                                    onChange={nextDefaultOnChange}
                                >
                                    {options.map(({id,name})=>(
                                        <MenuItem key={id} value={id}>{name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>}
                            <DialogContentText sx={{fontSize:'0.9rem'}}>* Once submitted, the action(s) above cannot be undone.</DialogContentText>
                        </Stack>
                        <input hidden type='submit' ref={submitRef} />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button color='error' variant='contained' onClick={submitOnClick}>Delete</Button>
                    <Button onClick={onClose}>Cancel</Button>
                </DialogActions>
            </Dialog>
        )
    })
DeleteBoardColumnDialog.displayName = 'DeleteBoardColumnDialog'
export default DeleteBoardColumnDialog