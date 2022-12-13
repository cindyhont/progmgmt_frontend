import React, { memo, useContext, useRef } from "react";
import TextField from '@mui/material/TextField';
import { Dayjs } from 'dayjs';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { editDateAction } from "./reducer";
import { Context } from ".";
import { useAppSelector } from "@reducers";

const DatePicker = memo((
    {
        label,
        field,
        value,
        maxDate,
        minDate
    }:{
        label:string;
        field:string;
        value:Dayjs|null;
        maxDate:Dayjs|null;
        minDate:Dayjs|null;
    }
)=>{
    const 
        {addEditTaskDispatch} = useContext(Context),
        isTouchScreen = useAppSelector(state => state.misc.isTouchScreen),
        onChange = (e:Dayjs) => addEditTaskDispatch(editDateAction({
            key:`${field}_edit`,
            value:e
        }))

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            {isTouchScreen ? <MobileDatePicker
                label={label}
                inputFormat="DD/MM/YYYY"
                value={value}
                onChange={onChange}
                renderInput={(params) => <TextField fullWidth {...params} />}
                maxDate={maxDate}
                minDate={minDate}
            /> : <DesktopDatePicker
                label={label}
                inputFormat="DD/MM/YYYY"
                value={value}
                onChange={onChange}
                renderInput={(params) => <TextField fullWidth {...params} />}
                maxDate={maxDate}
                minDate={minDate}
            />}
        </LocalizationProvider>
    )
})

DatePicker.displayName = 'DatePicker'
export default DatePicker