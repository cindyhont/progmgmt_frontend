import { BlankMessage } from '@components/common-components'
import { taskSelector } from '@components/tasks/reducers/slice'
import { ReduxState, useAppDispatch, useAppSelector } from '@reducers'
import { userDetailsSelector } from '@reducers/user-details/slice'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import React, { memo, SyntheticEvent, useEffect, useMemo, useState } from 'react'
import ItemWrapper from './item-wrapper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableFooter from '@mui/material/TableFooter'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination';
import Tooltip from '@mui/material/Tooltip';
import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded';
import Avatar from '@mui/material/Avatar'
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import TableSortLabel from '@mui/material/TableSortLabel';
import Link from '@mui/material/Link';
import { useRouter } from 'next/router'
import { updateRouterHistory } from '@reducers/misc'
import { useTheme } from '@mui/material'

type TsortKey = 'name'|'owner'|'deadline'

const 
    entriesPerPage = 5,
    selectTasks = (state:ReduxState) => taskSelector.selectAll(state).filter(e=>e.assignee===state.misc.uid),
    selectTaskCount = (state:ReduxState) => selectTasks(state).length,
    AssignedToMe = () => {
        const haveTask = useAppSelector(state => selectTaskCount(state) !== 0)
        return (
            <ItemWrapper title='Tasks Assigned to Me'>
                <>
                {haveTask
                ? <Content />
                : <BlankMessage text='Currently no task is assigned to you.' />}
                </>
            </ItemWrapper>
        )
    },
    Content = () => {
        const 
            pageCount = useAppSelector(state => Math.ceil(selectTaskCount(state) / entriesPerPage)),
            totalTaskCount = useAppSelector(state => selectTasks(state).length),
            [page,setPage] = useState(0),
            pageOnChange = (_:SyntheticEvent,e:number) => setPage(e),
            [sortOrder,setSortOrder] = useState<{sortKey:TsortKey;order:number}>({sortKey:'deadline',order:1}),
            entryIdSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    const 
                        today = new Date(),
                        nextCentury = new Date(today.getFullYear()+100,today.getMonth(),today.getDate()).valueOf(),
                        start = page * entriesPerPage,
                        tasks = selectTasks(state)
                            .map(e=>{
                                const owner = userDetailsSelector.selectById(state,e.owner)
                                return {
                                    id:e.id,
                                    name:e.name,
                                    deadline:e.deadlineDT || nextCentury,
                                    owner:!!owner ? `${owner.firstName} ${owner.lastName}` : ''
                                }
                            })
                            .sort((a,b)=>!a ? 0 : a[sortOrder.sortKey] > b[sortOrder.sortKey] ? sortOrder.order : sortOrder.order * -1)
                    return tasks.slice(start,Math.min(start + entriesPerPage,tasks.length)).map(({id})=>id)
                }
            ),[page,sortOrder.sortKey,sortOrder.order]),
            ids = useAppSelector(state => entryIdSelector(state))

        useEffect(()=>{
            if (page >= pageCount) setPage(pageCount - 1)
        },[pageCount])

        return (
            <Table size='small'>
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <SortLabel {...{thisLabelKey:'name',setSortOrder,...sortOrder}}>
                                <>Name</>
                            </SortLabel>
                        </TableCell>
                        <TableCell sx={{width:'0px',textAlign:'center',px:0}}>
                            <SortLabel {...{thisLabelKey:'owner',setSortOrder,...sortOrder}}>
                                <PersonRoundedIcon />
                            </SortLabel>
                        </TableCell>
                        <TableCell sx={{width:'0px',px:0}}>
                            <SortLabel {...{thisLabelKey:'deadline',setSortOrder,...sortOrder}}>
                                <CalendarMonthRoundedIcon />
                            </SortLabel>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {ids.map(e=>(<Row id={e} key={e} />))}
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TablePagination 
                            count={totalTaskCount}
                            page={page}
                            rowsPerPage={entriesPerPage}
                            onPageChange={pageOnChange}
                            labelRowsPerPage={<></>}
                            rowsPerPageOptions={[entriesPerPage]}
                            showFirstButton
                            showLastButton
                        />
                    </TableRow>
                </TableFooter>
            </Table>
        )
    },
    SortLabel = (
        {
            sortKey,
            order,
            setSortOrder,
            thisLabelKey,
            children
        }:{
            sortKey:TsortKey;
            order:number;
            setSortOrder:(v:{sortKey:TsortKey,order:number})=>void;
            thisLabelKey:TsortKey;
            children:JSX.Element;
        }
    ) => {
        const onClick = () => setSortOrder({sortKey:thisLabelKey,order:thisLabelKey===sortKey ? order * -1 : 1})
        return (
            <TableSortLabel
                active={thisLabelKey===sortKey}
                direction={thisLabelKey===sortKey ? order===1 ? 'asc' : 'desc' : 'asc'}
                onClick={onClick}
            >
                {children}
            </TableSortLabel>
        )
    },
    Row = memo(({id}:{id:EntityId})=>{
        const 
            {palette:{text}} = useTheme(),
            task = useAppSelector(state => taskSelector.selectById(state,id)),
            avatar = useAppSelector(state => userDetailsSelector.selectById(state,task.owner)?.avatar || ''),
            firstName = useAppSelector(state => userDetailsSelector.selectById(state,task.owner)?.firstName || ''),
            lastName = useAppSelector(state => userDetailsSelector.selectById(state,task.owner)?.lastName || ''),
            fullName = useMemo(()=>`${firstName} ${lastName}`.trim(),[firstName,lastName]),
            router = useRouter(),
            dispatch = useAppDispatch(),
            onClick = (e:SyntheticEvent) => {
                e.preventDefault()
                dispatch(updateRouterHistory({
                    asPath:router.asPath,
                    queryString:JSON.stringify(router.query)
                }))
                router.push({query:{page:'tasks',taskid:id}},`/tasks/t/${id}`,{shallow:true})
            }

        return (
            <>
            {!!task && <TableRow>
                <TableCell>
                    <Link href={`/tasks/t/${id}`} onClick={onClick} underline='hover' color={text.primary}>
                        {task.name}
                    </Link>
                </TableCell>
                <TableCell
                    sx={{width:0,px:0}}
                >
                    <Tooltip 
                        title={fullName}
                        disableFocusListener={!fullName}
                        disableHoverListener={!fullName}
                        disableTouchListener={!fullName}
                    >
                        <Avatar src={avatar} sx={{width:30,height:30}} />
                    </Tooltip>
                </TableCell>
                <TableCell sx={{px:0}}>{!!task.deadlineDT ? new Date(task.deadlineDT).toLocaleDateString('en-UK',{month:'numeric',day:'numeric'}) : 'N/A'}</TableCell>
            </TableRow>}
            </>
        )
    })
Row.displayName = 'Row'
export default AssignedToMe