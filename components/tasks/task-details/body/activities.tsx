import { ReduxState, useAppSelector } from '@reducers'
import React, { memo, SyntheticEvent, useEffect, useMemo, useState } from 'react'
import Stack from '@mui/material/Stack'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Pagination from '@mui/material/Pagination';
import { createSelector, EntityId } from '@reduxjs/toolkit'
import { userDetailsSelector } from '@reducers/user-details/slice'
import { useTheme } from '@mui/material'
import Tooltip from '@mui/material/Tooltip';
import Avatar from '@mui/material/Avatar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { useRouter } from 'next/router'
import { taskApprovalItemSelector, taskFieldSelector, taskRecordSelector } from '@components/tasks/reducers/slice'
import { TaskRecord } from '@components/tasks/interfaces'
import { BlankMessage } from '@components/common-components'

const 
    entriesPerPage = 10,
    Activities = memo(({display}:{display:boolean}) => {
        const 
            taskID = useRouter().query.taskid as string,
            hasActivities = useAppSelector(state => taskRecordSelector.selectAll(state).filter(e=>e.taskID===taskID).length !== 0)

        return (
            <Box sx={{display:display ? 'block' :'none'}}>
                {hasActivities && <ActivityList />}
                {!hasActivities && <BlankMessage text='No activities found' />}
            </Box>
        )
    }),
    ActivityList = () => {
        const 
            taskID = useRouter().query.taskid as string,
            pageCount = useAppSelector(state => Math.ceil(taskRecordSelector.selectAll(state).filter(e=>e.taskID===taskID).length / entriesPerPage)),
            [page,setPage] = useState(0),
            pageOnChange = (_:SyntheticEvent,e:number) => setPage(e),
            entryIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskRecordSelector.selectAll(state).filter(e=>e.taskID===taskID),
                (records:TaskRecord[])=>{
                    if (records.length===1) return [records[0].id]
                    const start = (page - 1) * entriesPerPage
                    return Array.from(records).sort((a,b)=>a.dt-b.dt).slice(start,Math.min(start + entriesPerPage,records.length)).map(({id})=>id)
                }
            ),[page,taskID]),
            ids = useAppSelector(state => entryIdSelector(state))

        useEffect(()=>{
            setPage(pageCount)
        },[])

        return (
            <Stack direction='column' spacing={2} my={2}>
                {ids.map(id=>(<Entry key={id} {...{id}} />))}
                <Grid container direction='row' sx={{justifyContent:'center',position:'sticky',bottom:'16px'}}>
                    <Pagination count={pageCount} page={page} onChange={pageOnChange} />
                </Grid>
            </Stack>
        )
    },
    Entry = memo(({id}:{id:EntityId})=>{
        const 
            e = useAppSelector(state => taskRecordSelector.selectById(state,id)),
            {avatar,firstName,lastName} = useAppSelector(state => userDetailsSelector.selectById(state,e.requester)),
            field = useAppSelector(state => taskFieldSelector.selectById(state,e.action))

        return (
            <Paper>
                <Table sx={{'.MuiTableCell-root':{border:'none'}}}>
                    <TableBody>
                        <TableRow>
                            <TableCell sx={{verticalAlign:'top',px:2,pb:0,pt:1.5,width:0}}>
                                <Avatar src={avatar} />
                            </TableCell>
                            <TableCell sx={{pb:1,pt:1.5,pl:0}}>
                                <Stack direction='column'>
                                    <Box sx={{mb:1}}>
                                        <Typography sx={{fontWeight:'bold',fontSize:'0.85rem'}}>{firstName} {lastName}</Typography>
                                        <Typography sx={{fontSize:'0.7rem',textTransform:'uppercase'}}>
                                            {new Date(e.dt).toLocaleString('en-UK',{dateStyle:'medium',timeStyle:'short',hour12:true})}
                                        </Typography>
                                    </Box>
                                    {e.action==='start' && <Start />}
                                    {e.action==='approval' && <Approval status={+e.approval} />}
                                    {field?.fieldType==='single_person' && <SinglePerson action={e.action} userID={e.addPersonnel[0]} />}
                                    {field?.fieldType==='people' && <People {...e} />}
                                </Stack>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </Paper>
        )
    }),
    Start = memo(()=>(<Typography sx={{fontSize:'0.9rem'}}>started this task.</Typography>)),
    Approval = memo(({status}:{status:number})=>{
        const desc = useAppSelector(state => taskApprovalItemSelector.selectById(state,status).name)
        return (
            <Typography sx={{fontSize:'0.9rem'}}>set this task as: {desc}</Typography>
        )
    }),
    SinglePerson = memo((
        {
            action,
            userID
        }:{
            action:EntityId;
            userID:EntityId;
        }
    )=>{
        return (
            <>
            {action==='assignee' 
            ? <Typography sx={{fontSize:'0.9rem'}}>assigned this task to <User id={userID} />.</Typography>
            : <Typography sx={{fontSize:'0.9rem'}}>set <User id={userID} /> as {action}.</Typography>}
            </>
        )
    }),
    People = memo((
        {
            action,
            addPersonnel,
            removePersonnel
        }:{
            action:string;
            addPersonnel:EntityId[];
            removePersonnel:EntityId[];
        }
    )=>(
        <Typography sx={{fontSize:'0.9rem'}}>
            {addPersonnel.length !== 0 && <>added {addPersonnel.map(e=>(<User id={e} key={e} />)).reduce((prev,curr)=>!!prev ? <>{prev}, {curr}</> : curr)} as {action}</>}
            {addPersonnel.length !== 0 && removePersonnel.length !== 0 && ' and '}
            {removePersonnel.length !== 0 && <>removed {removePersonnel.map(e=>(<User id={e} key={e} />)).reduce((prev,curr)=>!!prev ? <>{prev}, {curr}</> : curr)} from {action}</>}
        .</Typography>
    )),
    User = ({id}:{id:EntityId}) => {
        const
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,id)?.avatar || ''),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,id)?.firstName || ''),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,id)?.lastName || ''),
            {palette:{primary,grey,mode}} = useTheme(),
            TooltipComponent = () => (
                <Table sx={{'.MuiTableCell-root':{border:'none',p:0}}}>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Avatar src={avatar} sx={{mr:1}} />
                            </TableCell>
                            <TableCell>
                                <Typography>{firstName} {lastName}</Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )

        return (
            <Tooltip 
                title={<TooltipComponent />} 
                componentsProps={{
                    tooltip:{
                        sx:{
                            backgroundColor:grey[mode==='light' ? 200 : 800],
                            py:1
                        }
                    }
                }}
            >
                <Typography 
                    component='span'
                    sx={{
                        color:primary.main,
                        textDecoration:'underline',
                        textUnderlineOffset:'0.25rem',
                        cursor:'help'
                    }}
                >{firstName} {lastName}</Typography>
            </Tooltip>
        )
    }
Activities.displayName = 'Activities'
Entry.displayName = 'Entry'
Start.displayName = 'Start'
Approval.displayName = 'Approval'
SinglePerson.displayName = 'SinglePerson'
People.displayName = 'People'
export default Activities