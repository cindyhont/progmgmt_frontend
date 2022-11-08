import React, { memo, useEffect } from 'react';
import { shallowEqual } from "react-redux";
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import DeptFileUploader from './file';
import DeptManual from './manual';
import { updateDeptFormat } from '../reducer';
import { useAppDispatch, useAppSelector } from '@reducers';

const DepartmentNames = memo(() => {
    const 
        dispatch = useAppDispatch(),
        deptFormat = useAppSelector(state=>state.startPage.deptFormat,shallowEqual),
        title = useAppSelector(state=>state.startPage.steps[0],shallowEqual),
        deptFormatOnChange = (e:any) => dispatch(updateDeptFormat(e.target.value))
        
    return (
        <>
            <Typography variant="h5" component="div" align='center' sx={{mt:5,mb:3}}>{title}</Typography>
            <Box sx={{boxShadow:'0px 0px 5px #ccc',borderRadius:2,p:3}}>
                <RadioGroup
                    row
                    name="row-radio-buttons-group"
                    sx={{
                        display:'flex',
                        flexDirection:'row',
                        justifyContent:'space-evenly'
                    }}
                    onChange={deptFormatOnChange}
                    value={deptFormat}
                >
                    <FormControlLabel value="csv" control={<Radio />} label="Import .csv file" />
                    <FormControlLabel value="manual" control={<Radio />} label="Input manually" />
                </RadioGroup>
                <DeptFileUploader />
                <DeptManual />
            </Box>
        </>
    )
})
DepartmentNames.displayName = 'DepartmentNames'
export default DepartmentNames;