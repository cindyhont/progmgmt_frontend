import { ReduxState, useAppSelector } from '@reducers'
import { createSelector, EntityId } from '@reduxjs/toolkit'
import React, { ChangeEvent, memo, useMemo } from 'react'
import { getTaskDetailsSidebarModuleID, sideBarHeadStyle } from '.'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Checkbox from '@mui/material/Checkbox';
import { useStore } from 'react-redux'
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Box from '@mui/material/Box'
import { useTheme } from '@mui/material'
import { taskFieldSelector, taskSelector, taskTimeRecordsSelector } from '@components/tasks/reducers/slice'
import { Task, TaskField } from '@components/tasks/interfaces'
import { useTaskUpdateMyTimerMutation, useTaskUpdateOneFieldMutation } from '@components/tasks/reducers/api'
import { useRouter } from 'next/router'

const CheckboxElem = memo((
    {
        fieldName,
        fieldID,
        onDragStart,
        onDragEnter,
    }:{
        fieldName:string;
        fieldID:EntityId;
        onDragStart:()=>void;
        onDragEnter:()=>void;
    }
)=>{
    const 
        theme = useTheme(),
        router = useRouter(),
        taskID = router.query.taskid as string,
        editRightSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>state.misc.uid,
            (state:ReduxState)=>taskSelector.selectById(state,taskID),
            (state:ReduxState)=>taskFieldSelector.selectById(state,fieldID),
            (uid:EntityId,task:Task,field:TaskField)=>!!field 
                && (!field.details 
                    || !!field.details && (
                        task.isGroupTask && [...task.supervisors,task.owner].includes(uid)
                        || !task.isGroupTask && [task.owner].includes(uid)
                    )
                )
        ),[fieldID,taskID]),
        editRight = useAppSelector(state => editRightSelector(state)),
        checkedSelector = useMemo(()=>createSelector(
            (state:ReduxState)=>taskSelector.selectById(state,taskID)[fieldID] as boolean,
            (e:boolean)=>e
        ),[taskID,fieldID]),
        checked = useAppSelector(state => checkedSelector(state)),
        [updateField] = useTaskUpdateOneFieldMutation(),
        store = useStore(),
        [updateMyTimer] = useTaskUpdateMyTimerMutation(),
        onChange = (e:ChangeEvent<HTMLInputElement>) => {
            if (!editRight) return
            const 
                state = store.getState() as ReduxState,
                uid = state.misc.uid
            updateField({
                id:taskID,
                field:fieldID,
                value:e.target.checked
            })
            if (fieldID==='trackTime' && taskTimeRecordsSelector.selectAll(state).findIndex(r=>r.taskID===taskID && r.uid===uid && !r.end) !== -1) updateMyTimer(taskID)
        }

    return (
        <Paper
            draggable
            onDragStart={onDragStart}
            onDragEnter={onDragEnter}
            id={getTaskDetailsSidebarModuleID(fieldID)}
        >
            <Table 
                sx={{
                    '.MuiTableCell-root':{
                        p:0,
                        border:'none',
                        '&:not(:last-of-type)':{
                            py:1
                        }
                    }
                }}
            >
                <TableBody>
                    <TableRow>
                        <TableCell sx={{width:0,cursor:'move'}}>
                            <Box sx={{display:'flex',justifyContent:'center'}}>
                                <DragIndicatorIcon fontSize="small" sx={{mx:1}} htmlColor={theme.palette.grey[500]} />
                            </Box>
                        </TableCell>
                        <TableCell>
                            <Typography sx={sideBarHeadStyle}>{fieldName}</Typography>
                        </TableCell>
                        {editRight && <TableCell sx={{width:0}}>
                            <Checkbox sx={{p:1}} checked={checked} onChange={onChange} />
                        </TableCell>}
                        {!editRight && <TableCell sx={{width:0}}>
                            <Box sx={{display:'flex',justifyContent:'center'}}>
                                {checked ? <CheckBoxIcon sx={{m:1}} /> : <CheckBoxOutlineBlankIcon sx={{m:1,mr:1.2}} />}
                            </Box>
                        </TableCell>}
                    </TableRow>
                </TableBody>
            </Table>
        </Paper>
    )
})
CheckboxElem.displayName = 'CheckboxElem'
export default CheckboxElem