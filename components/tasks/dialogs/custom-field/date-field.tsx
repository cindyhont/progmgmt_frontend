import React, { useContext, useEffect, useRef } from "react";
import TextField from '@mui/material/TextField';
import { Dayjs } from 'dayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Context } from ".";
import { editDefaultValueAction } from "./reducer";
import { EntityId } from "@reduxjs/toolkit";
import { useAppSelector } from "@reducers";

const DateField = (
    {
        fieldTypeID,
        date
    }:{
        fieldTypeID:EntityId;
        date:Dayjs|null;
    }
) => {
    const
        {customFieldDispatch} = useContext(Context),
        isTouchScreen = useAppSelector(state => state.misc.isTouchScreen),
        onChange = (e:Dayjs) => customFieldDispatch(editDefaultValueAction({
            key:fieldTypeID,
            value:e
        })),
        desktopRef = useRef<HTMLInputElement>()

    useEffect(()=>{
        if (!isTouchScreen) desktopRef.current.focus()
    },[])

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {isTouchScreen ? <MobileDatePicker
                label='Default date'
                inputFormat="DD/MM/YYYY"
                value={date}
                onChange={onChange}
                renderInput={(params) => <TextField {...params} />}
            /> : <DesktopDatePicker
                inputRef={desktopRef}
                label='Default date'
                inputFormat="DD/MM/YYYY"
                value={date}
                onChange={onChange}
                renderInput={(params) => <TextField {...params} />}
            />}
        </LocalizationProvider>
    )
}

export default DateField