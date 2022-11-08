import { ReduxState, useAppSelector } from "@reducers";
import { createSelector, EntityId } from "@reduxjs/toolkit";
import React, { memo, useCallback, useMemo, useRef, useState, KeyboardEvent, useEffect } from "react";
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import dayjs, { Dayjs } from "dayjs";
import TextField from '@mui/material/TextField'
import { useStore } from "react-redux";
import TextFieldSubmitButton from "./text-field-submit-button";
import EditModeToggle from "./edit-mode-toggle-button";
import SimpleTextDisplay from "./simple-text-display";
import TextDisplayWrapper from "./text-display-wrapper";
import { taskSelector } from "@components/tasks/reducers/slice";
import { useTaskUpdateOneFieldMutation } from "@components/tasks/reducers/api";
import { createEditRightSelector } from ".";
import { useRouter } from "next/router";

const 
    DateElem = memo(({fieldID}:{fieldID:EntityId})=>{
        const 
            taskID = useRouter().query.taskid as string,
            dateSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>taskSelector.selectById(state,taskID)[fieldID] as number,
                (e:number)=>e
            ),[taskID,fieldID]),
            date = useAppSelector(state => dateSelector(state)),
            editRightSelector = useMemo(()=>createEditRightSelector(fieldID,taskID),[fieldID,taskID]),
            minDateSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    if (fieldID !== 'deadlineDT') return null
                    const task = taskSelector.selectById(state,taskID)
                    return !!task.startDT ? dayjs(task.startDT) : null
                }
            ),[fieldID,taskID]),
            maxDateSelector = useMemo(()=>createSelector(
                (state:ReduxState)=>state,
                (state:ReduxState)=>{
                    if (fieldID !== 'startDT') return null
                    const task = taskSelector.selectById(state,taskID)
                    return !!task.deadlineDT ? dayjs(task.deadlineDT) : null
                }
            ),[fieldID,taskID]),
            minDate = useAppSelector(state => minDateSelector(state)),
            maxDate = useAppSelector(state => maxDateSelector(state)),
            hasEditRight = useAppSelector(state => editRightSelector(state)),
            isTouchScreen = useAppSelector(state => state.misc.isTouchScreen),
            [editMode,setEditMode] = useState(false),
            editModeOff = useCallback(()=>setEditMode(false),[]),
            editOnClick = useCallback(() => setEditMode(true),[])

        useEffect(()=>{
            if (!hasEditRight) setEditMode(false)
        },[hasEditRight])

        return (
            <TextDisplayWrapper {...{editMode}}>
                <>
                {!editMode && <TableRow>
                    <SimpleTextDisplay {...{
                        nilTextColor:!date,
                        content:!!date ? new Date(date).toLocaleDateString('en-UK',{dateStyle:'medium'}) : 'N/A'
                    }} />
                    {hasEditRight && <EditModeToggle {...{onClick:editOnClick}} />}
                </TableRow>}
                {editMode && isTouchScreen && <TableRow>
                    <TableCell>
                        <MobilePicker {...{
                            editModeOff,
                            date:!!date ? dayjs(date) : null,
                            minDate,
                            maxDate,
                            fieldID
                        }} />
                    </TableCell>    
                </TableRow>}
                {editMode && !isTouchScreen && <DesktopPicker {...{
                    editModeOff,
                    date:!!date ? dayjs(date) : null,
                    minDate,
                    maxDate,
                    fieldID
                }} />}
                </>
            </TextDisplayWrapper>
        )
    }),
    MobilePicker = memo((
        {
            editModeOff,
            date,
            minDate,
            maxDate,
            fieldID,
        }:{
            editModeOff:()=>void;
            date:Dayjs|null;
            minDate:Dayjs|null;
            maxDate:Dayjs|null;
            fieldID:EntityId;
        }
    ) => {
        const 
            router = useRouter(),
            taskID = router.query.taskid as string,
            [dateValue,setDateValue] = useState(date),
            onChange = (e:Dayjs) => setDateValue(e),
            [updateField] = useTaskUpdateOneFieldMutation(),
            store = useStore(),
            onSubmit = () => {
                const state = store.getState() as ReduxState
                updateField({id:taskID,field:fieldID,value:!!dateValue && dateValue.isValid() ? dateValue.valueOf() : 0})
                editModeOff()
            }

        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker 
                    value={dateValue}
                    onClose={editModeOff}
                    onChange={onChange}
                    onAccept={onSubmit}
                    DialogProps={{
                        open:true,
                        onClose:editModeOff
                    }}
                    minDate={minDate}
                    maxDate={maxDate}
                    renderInput={(params) => <TextField {...params} fullWidth size='small' />}
                />
            </LocalizationProvider>
        )
    }),
    DesktopPicker = memo((
        {
            editModeOff,
            date,
            minDate,
            maxDate,
            fieldID,
        }:{
            editModeOff:()=>void;
            date:Dayjs|null;
            minDate:Dayjs|null;
            maxDate:Dayjs|null;
            fieldID:EntityId;
        }
    )=>{
        const 
            taskID = useRouter().query.taskid as string,
            textFieldRef = useRef<HTMLInputElement>(),
            [dateValue,setDateValue] = useState(date),
            onChange = (e:Dayjs) => setDateValue(e),
            [updateField] = useTaskUpdateOneFieldMutation(),
            onSubmit = () => {
                updateField({id:taskID,field:fieldID,value:!!dateValue && dateValue.isValid() ? dateValue.valueOf() : 0})
                editModeOff()
            },
            onKeyPress = (e:KeyboardEvent) => {
                if (e.code === 'Enter' && !e.shiftKey && !e.altKey && !e.ctrlKey) {
                    e.preventDefault()
                    onSubmit()
                }
            }

        return (
            <TableRow>
                <TableCell>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DesktopDatePicker
                            inputFormat="DD/MM/YYYY"
                            value={dateValue}
                            onChange={onChange}
                            renderInput={(params) => <TextField 
                                {...params} 
                                fullWidth 
                                size='small' 
                                sx={{ml:1}} 
                                inputRef={textFieldRef} 
                                onKeyUp={onKeyPress}
                            />}
                            maxDate={maxDate}
                            minDate={minDate}
                            PopperProps={{
                                anchorEl:()=>textFieldRef.current,
                            }}
                        />
                    </LocalizationProvider>
                </TableCell>
                <TableCell>
                    <TextFieldSubmitButton {...{onSubmit}} />
                </TableCell>
            </TableRow>
        )
    })
DateElem.displayName = 'DateElem'
MobilePicker.displayName = 'MobilePicker'
DesktopPicker.displayName = 'DesktopPicker'
export default DateElem