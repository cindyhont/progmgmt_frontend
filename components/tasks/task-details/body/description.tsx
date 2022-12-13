import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { ChangeEvent, memo, useCallback, useEffect, useMemo, useState } from "react";
import { taskSelector } from "../../reducers/slice";
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import { useStore } from "react-redux";
import { useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { Task } from "@components/tasks/interfaces";
import { useRouter } from "next/router";
import { WYSIWYGcommon } from "@components/common-components";

const 
    Description = memo(()=>{
        const 
            {query} = useRouter(),
            taskID = query.taskid as string,
            editRightSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID),
                (state:ReduxState)=>state.misc.uid,
                (task:Task,uid:EntityId)=>[...task.supervisors,task.owner].includes(uid)
            ),[taskID]),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            [editMode,setEditMode] = useState(false),
            editModeOn = useCallback(()=>setEditMode(true),[]),
            editModeOff = useCallback(()=>setEditMode(false),[])

        useEffect(()=>{
            if (!hasEditRight) setEditMode(false)
        },[hasEditRight])

        if (editMode) return <ReadWrite {...{editModeOff}} />
        return <ReadOnly {...{hasEditRight,editModeOn}} />
    }),
    ReadOnly = memo((
        {
            hasEditRight,
            editModeOn,
        }:{
            hasEditRight:boolean;
            editModeOn:()=>void;
        }
    )=>{
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            descriptionSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID).description,
                (e:string)=>e
            ),[taskID]),
            description = useAppSelector(state => descriptionSelector(state))

        return (
            <Paper sx={{px:2}}>
                <Stack direction='column' spacing={0}>
                    {hasEditRight && <Box sx={{display:'flex',flexDirection:'row',justifyContent:'flex-start',mt:1.5}}>
                        <Button variant="outlined" onClick={editModeOn} endIcon={<EditRoundedIcon />} sx={{fontSize:'0.8rem'}}>Edit</Button>
                    </Box>}
                    <Box dangerouslySetInnerHTML={{__html:description}} />
                </Stack>
            </Paper>
        )
    }),
    ReadWrite = memo(({editModeOff}:{editModeOff:()=>void;})=>{
        const 
            [value,setValue] = useState(''),
            store = useStore(),
            router = useRouter(),
            taskID = router.query.taskid as string,
            handleUpdate = (e:string) => setValue(e),
            [updateField] = useTaskUpdateOneFieldMutation(),
            onSubmit = () => {
                updateField({
                    id:taskID,
                    field:'description',
                    value
                })
                editModeOff()
            }

        useEffect(()=>{
            const state = store.getState() as ReduxState
            setValue(taskSelector.selectById(state,taskID).description || '')
        },[taskID])

        return (
            <Stack direction='column' spacing={2}>
                <WYSIWYGcommon {...{
                    value,
                    handleUpdate,
                    placeholder:`Edit description ...`,
                    height:'calc(100vh - 150px)',
                }} />
                <Stack direction='row' spacing={3} sx={{justifyContent:'flex-start'}}>
                    <Button variant="contained" onClick={onSubmit}>OK</Button>
                    <Button variant='outlined' onClick={editModeOff}>Cancel</Button>
                </Stack>
            </Stack>
        )
    })
Description.displayName = 'Description'
ReadOnly.displayName = 'ReadOnly'
ReadWrite.displayName = 'ReadWrite'
export default Description