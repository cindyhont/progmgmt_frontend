import React, { useCallback, useEffect, useRef, useState } from "react";
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import { useAppDispatch, useAppSelector } from "@reducers";
import { taskEditSingleField, taskSelector } from "../reducers/slice";
import { EntityId } from "@reduxjs/toolkit";
import TextField from '@mui/material/TextField';
import dayjs, { Dayjs } from 'dayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import taskApi from "../reducers/api";
import { v4 as uuidv4 } from 'uuid'

const 
    DateElem = (
        {
            id,
            field,
            onDragEnter,
            hasEditRight,
            editMode,
        }:{
            id:EntityId;
            field:EntityId;
            onDragEnter:()=>void;
            hasEditRight:boolean;
            editMode:boolean;
        }
    ) => {
        const 
            value = useAppSelector(state => taskSelector.selectById(state,id)[field]),
            startDT = useAppSelector(state => taskSelector.selectById(state,id).startDT),
            deadlineDT = useAppSelector(state => taskSelector.selectById(state,id).deadlineDT),
            isTouchScreen = useAppSelector(state => state.misc.isTouchScreen),
            dispatch = useAppDispatch(),
            editModeOff = useCallback(()=>dispatch(taskEditSingleField(false)),[])

        return (
            <TableCell 
                className={`${field.toString()} task-list-body-cell`}
                onDragEnter={onDragEnter}
                data-field={field}
                data-taskid={id}
                sx={{
                    ...(editMode && {p:0})
                }}
            >
                {!editMode && <Typography sx={{fontSize:'0.9rem'}}>{!!value ? new Date(value).toLocaleDateString('en-UK',{dateStyle:'medium'}) : ''}</Typography>}
                {editMode && isTouchScreen && <MobilePicker {...{
                    value:!!value ? dayjs(value) : null,
                    minDate:field==='deadlineDT' && !!startDT ? dayjs(startDT) : null,
                    maxDate:field==='startDT' && !!deadlineDT ? dayjs(deadlineDT) : null,
                    editModeOff,
                    id,
                    field,
                }} />}
                {editMode && !isTouchScreen && <DesktopPicker {...{
                    value:!!value ? dayjs(value) : null,
                    minDate:field==='deadlineDT' && !!startDT ? dayjs(startDT) : null,
                    maxDate:field==='startDT' && !!deadlineDT ? dayjs(deadlineDT) : null,
                    editModeOff,
                    id,
                    field,
                }} />}
            </TableCell>
        )
    },
    MobilePicker = (
        {
            value,
            minDate,
            maxDate,
            editModeOff,
            id,
            field,
        }:{
            value:Dayjs|null;
            minDate:Dayjs|null;
            maxDate:Dayjs|null;
            editModeOff:()=>void;
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            ref = useRef<HTMLInputElement>(),
            dispatch = useAppDispatch(),
            [dateValue,setDateValue] = useState(value),
            onChange = (e:Dayjs) => setDateValue(e),
            onSubmit = () => {
                dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:!!dateValue && dateValue.isValid() ? dateValue.valueOf() : 0}))
                editModeOff()
            }

        useEffect(()=>{
            ref.current.click()
        },[])

        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <MobileDatePicker
                    inputFormat="DD/MM/YYYY"
                    value={dateValue}
                    onChange={onChange}
                    onClose={editModeOff}
                    onAccept={onSubmit}
                    DialogProps={{
                        onClose:editModeOff
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth size='small' inputRef={ref} />}
                    maxDate={maxDate}
                    minDate={minDate}
                />
            </LocalizationProvider>
        )
    },
    DesktopPicker = (
        {
            value,
            minDate,
            maxDate,
            editModeOff,
            id,
            field,
        }:{
            value:Dayjs|null;
            minDate:Dayjs|null;
            maxDate:Dayjs|null;
            editModeOff:()=>void;
            id:EntityId;
            field:EntityId;
        }
    ) => {
        const 
            textFieldRef = useRef<HTMLInputElement>(),
            dispatch = useAppDispatch(),
            [dateValue,setDateValue] = useState(value),
            buttonValueText = useRef(uuidv4()).current,
            onChange = (e:Dayjs) => setDateValue(e),
            onBlur = (e:React.FocusEvent<HTMLInputElement>) => {
                const elem = e.relatedTarget as HTMLInputElement
                if (!elem || !elem.ariaValueText || elem.ariaValueText!==buttonValueText) {
                    dispatch(taskApi.endpoints.taskUpdateOneField.initiate({id,field,value:!!dateValue && dateValue.isValid() ? dateValue.valueOf() : 0}))
                    editModeOff()
                }
            },
            onClose = () => setTimeout(()=>textFieldRef.current.focus(),60)

        useEffect(()=>{
            if (!!value && value.isValid()) textFieldRef.current.value = value.format("DD/MM/YYYY")
            textFieldRef.current.focus()
        },[])

        return (
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                    inputFormat="DD/MM/YYYY"
                    value={dateValue}
                    onChange={onChange}
                    onClose={onClose}
                    renderInput={(params) => <TextField {...params} fullWidth size='small' inputRef={textFieldRef} onBlur={onBlur} />}
                    maxDate={maxDate}
                    minDate={minDate}
                    PopperProps={{
                        anchorEl:()=>textFieldRef.current,
                    }}
                    OpenPickerButtonProps={{
                        "aria-valuetext":buttonValueText
                    }}
                />
            </LocalizationProvider>
        )
    }

export default DateElem