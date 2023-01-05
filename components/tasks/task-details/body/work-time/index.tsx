import { Task } from '@components/tasks/interfaces'
import { taskSelector, taskTimeRecordsSelector } from '@components/tasks/reducers/slice'
import { ReduxState, useAppSelector } from '@reducers'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import React, { ChangeEvent, Dispatch, memo, SyntheticEvent, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import Stack from '@mui/material/Stack'
import { shallowEqual } from 'react-redux'
import Button from '@mui/material/Button'
import { userDetailsSelector } from '@reducers/user-details/slice'
import { useStore } from 'react-redux'
import { addAction, deleteAction, Iaction, reducer, setAllAction } from './reducer'
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Grid from '@mui/material/Grid'
import Pagination from '@mui/material/Pagination';
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import FunctionsIcon from '@mui/icons-material/Functions';
import Box from '@mui/material/Box'
import { useRouter } from 'next/router'
import { BlankMessage } from '@components/common-components'
import { numberToInterval } from '@components/functions'

export interface Irecord {
    id:EntityId;
    timeAccum:number;
}

const
    entriesPerPage = 10,
    selectReduxState = (state:ReduxState) => state,
    selectMyUserID = (state:ReduxState)=>state.misc.uid,
    checkIfHasAllRight = (t:Task,uid:EntityId) => [...t.supervisors,t.owner].includes(uid),
    selectRecords = (uid:EntityId,task:Task,state:ReduxState)=> {
        const 
            hasAllRights = checkIfHasAllRight(task,uid),
            taskID = task.id

        return {
            hasAllRights,
            records:hasAllRights 
                ? taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===taskID) 
                : taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===taskID && e.uid===uid)
        }
    },
    WorkTime = ({display}:{display:boolean}) => {
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            recordExistSelector = useMemo(()=>createSelector(
                selectMyUserID,
                (state:ReduxState) => taskSelector.selectById(state,taskID),
                selectReduxState,
                (uid:EntityId,task:Task,state:ReduxState)=> {
                    const {hasAllRights,records} = selectRecords(uid,task,state)
                    return {hasAllRights,hasRecord:records.length!==0}
                }
            ),[taskID]),
            {hasRecord,hasAllRights} = useAppSelector(state => recordExistSelector(state),shallowEqual)

        return (
            <Box sx={{display:display ? 'block' : 'none'}}>
                {hasRecord && <Content />}
                {!hasRecord && <BlankMessage text={hasAllRights ? 'No work time yet for this task' : 'You have not worked on this task.'} />}
            </Box>
        )
    },
    Content = () => {
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            rightsSelector = useMemo(()=>createSelector(
                selectMyUserID,
                (state:ReduxState) => taskSelector.selectById(state,taskID),
                selectReduxState,
                (uid:EntityId,task:Task)=> checkIfHasAllRight(task,uid)
            ),[taskID]),
            hasAllRights = useAppSelector(state => rightsSelector(state)),
            allUserIDsSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>Array.from(new Set(taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===taskID).map(({uid})=>uid))),
                (e:EntityId[])=>e
            ),[taskID]),
            allUserIDs = useAppSelector(state => allUserIDsSelector(state)),
            store = useStore(),
            [userIDs,setUserIDs] = useState<EntityId[]>([]),
            [dialogOpen,setDialogOpen] = useState(false),
            dialogOnOpen = () => setDialogOpen(true),
            dialogOnClose = () => setDialogOpen(false),
            [state,userDispatch] = useReducer(reducer,{list:allUserIDs}),
            updateUserIDs = () => {
                if (state.list.length !== userIDs.length || !state.list.every(e=>userIDs.includes(e))) setUserIDs([...state.list])
                dialogOnClose()
            },
            [page,setPage] = useState(0),
            contentSelector = useMemo(()=>createSelector(
                selectReduxState,
                (state:ReduxState)=>{
                    if (!userIDs.length) return {pageCount:0,records:[]}
                    const 
                        allRecords = taskTimeRecordsSelector.selectAll(state).filter(e=>e.taskID===taskID && userIDs.includes(e.uid)),
                        totalCount = allRecords.length,
                        pageCount = Math.ceil(totalCount / entriesPerPage)

                    if (!totalCount) return {pageCount,records:[]}
                    else if (totalCount===1){
                        const {id,start,end} = allRecords[0]
                        return {pageCount,records:[{id,timeAccum:!!end ? end-start : 0}] as Irecord[]}
                    }

                    const 
                        sortedRecords = Array.from(allRecords).sort((a,b)=>a.start - b.start),
                        finalPage = Math.min(page,pageCount),
                        startIdx = (finalPage - 1) * entriesPerPage

                    let timeAccum = 0, arr:Irecord[] = []

                    sortedRecords.forEach(({id,start,end})=>{
                        if (!!end) timeAccum += end - start
                        arr.push({id,timeAccum})
                    })

                    return {
                        pageCount,
                        records:arr.slice(startIdx,Math.min(startIdx + entriesPerPage,totalCount))
                    }
                }
            ),[userIDs,page,taskID]),
            {pageCount,records} = useAppSelector(state => contentSelector(state)),
            pageOnChange = (_:SyntheticEvent,e:number) => setPage(e)


        useEffect(()=>{
            const s = store.getState() as ReduxState
            if (hasAllRights) setUserIDs(state.list)
            else {
                setUserIDs([s.misc.uid])
                setDialogOpen(false)
            }
        },[hasAllRights])

        useEffect(()=>{
            if (dialogOpen) userDispatch(setAllAction(userIDs))
        },[dialogOpen])

        useEffect(()=>{
            const 
                s = store.getState() as ReduxState,
                newPageCount = contentSelector(s).pageCount
            setPage(newPageCount)
        },[userIDs])

        return (
            <>
            <Stack direction='column' spacing={2} my={2}>
                {hasAllRights && <Button variant='outlined' startIcon={<FilterAltIcon />} onClick={dialogOnOpen}>Select users</Button>}
                {pageCount===0 && <BlankMessage text={!!userIDs.length ? `The chosen user${userIDs.length === 1 ? ' has' : 's have'} not worked on this task` : 'No user selected'} />}
                {pageCount!==0 && <>
                    {records.map(({id,timeAccum})=>(
                        <Record key={id} {...{id,timeAccum}} />
                    ))}
                    <Grid container direction='row' sx={{justifyContent:'center',position:'sticky',bottom:'16px'}}>
                        <Pagination count={pageCount} page={page} onChange={pageOnChange} />
                    </Grid>
                </>}
            </Stack>
            <Dialog open={dialogOpen} onClose={dialogOnClose} keepMounted>
                <DialogTitle>Select Users</DialogTitle>
                <DialogContent>
                    <FormGroup>
                        {allUserIDs.map(id=>(
                            <DialogRow key={id} {...{id,userDispatch,checked:state.list.includes(id)}} />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions>
                    <Button onClick={dialogOnClose}>Cancel</Button>
                    <Button onClick={updateUserIDs} variant='contained'>OK</Button>
                </DialogActions>
            </Dialog>
            </>
        )
    },
    DialogRow = memo((
        {
            id,
            checked,
            userDispatch
        }:{
            id:EntityId;
            checked:boolean;
            userDispatch:Dispatch<Iaction>
        }
    )=>{
        const 
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,id).lastName),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,id).firstName),
            onChange = (_:ChangeEvent<HTMLInputElement>,e:boolean) => {
                if (e) userDispatch(addAction(id))
                else userDispatch(deleteAction(id))
            }
        return (
            <FormControlLabel 
                label={`${firstName} ${lastName}`.trim()} 
                control={<Checkbox checked={checked} onChange={onChange} />}
            />
        )
    }),
    numberToDateTimeString = (e:number) => new Date(e).toLocaleString('en-UK',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit',second:'2-digit',hour12:true}),
    Record = memo(({id,timeAccum}:Irecord)=>{
        const 
            {uid,start,end}:{uid:EntityId;start:number;end:number} = useAppSelector(state => taskTimeRecordsSelector.selectById(state,id),shallowEqual),
            {avatar,lastName,firstName}:{avatar:string;lastName:string;firstName:string;} = useAppSelector(state=>userDetailsSelector.selectById(state,uid),shallowEqual)

        return (
            <Paper>
                <Table sx={{'.MuiTableCell-root':{border:'none'}}}>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{verticalAlign:'top',px:2,pb:0,pt:1.5,width:0}}>
                                <Avatar src={avatar} />
                            </TableCell>
                            <TableCell sx={{py:1,pl:0}}>
                                <List 
                                    sx={{
                                        p:0,
                                        '.MuiListItem-root':{
                                            p:0,
                                            '&:first-of-type .MuiTypography-root':{
                                                fontWeight:'bold',
                                                fontSize:'0.85rem'
                                            },
                                            '&:not(:first-of-type) .MuiListItemText-root,&:not(:first-of-type) .MuiTypography-root':{
                                                fontSize:'0.8rem',
                                            },
                                            '&:nth-of-type(2) .MuiTypography-root':{
                                                textTransform:'uppercase'
                                            },
                                        },
                                        '.MuiListItemText-root':{m:0},
                                        '.MuiListItemIcon-root':{minWidth:'unset',pr:1},
                                        '.MuiSvgIcon-root':{width:15,height:15}
                                    }}
                                >
                                    <ListItem>
                                        <ListItemText>{firstName} {lastName}</ListItemText>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <AccessTimeRoundedIcon />
                                        </ListItemIcon>
                                        <ListItemText>{numberToDateTimeString(start)} - {!!end ? numberToDateTimeString(end) : 'working'}</ListItemText>
                                    </ListItem>
                                    <ListItem>
                                        <ListItemIcon>
                                            <FunctionsIcon />
                                        </ListItemIcon>
                                        {!!end ? <ListItemText>{numberToInterval(timeAccum)}</ListItemText> : <Counting {...{start,timeAccum}} />}
                                    </ListItem>
                                </List>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        )
    }),
    Counting = memo((
        {
            start,
            timeAccum
        }:{
            start:number;
            timeAccum:number;
        }
    )=>{
        const 
            ref = useRef<HTMLDivElement>(),
            initial = useRef(timeAccum - start).current,
            timeoutRef = useRef<NodeJS.Timeout>(),
            pageVisibility = useAppSelector(state => state.misc.pageVisibility),
            showTime = () => {
                const diff = Date.now() + initial
                ref.current.innerText = numberToInterval(diff)
                timeoutRef.current = setTimeout(showTime,1000 - (diff % 1000))
            }

        useEffect(()=>{
            if (pageVisibility) showTime()
            return () => clearTimeout(timeoutRef.current)
        },[pageVisibility])

        return (
            <ListItemText ref={ref} />
        )
    })
DialogRow.displayName = 'DialogRow'
Record.displayName = 'Record'
Counting.displayName = 'Counting'
export default WorkTime