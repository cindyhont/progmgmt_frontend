import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { shallowEqual } from 'react-redux';
import { updateAdminStaffID } from './reducer';
import { useAppDispatch, useAppSelector } from '@reducers';
import Autocomplete from '@mui/material/Autocomplete';
import Papa from 'papaparse'
import TextField from '@mui/material/TextField';
import { getFiledataPromise } from '../functions';

const SelectAdmin = () => {
    const 
        step = useAppSelector(state=>state.startPage.step,shallowEqual),
        stepTitle = useAppSelector(state=>state.startPage.steps[2],shallowEqual),
        adminStaffID = useAppSelector(state=>state.startPage.adminStaffID,shallowEqual),
        [staffList,setStaffList] = useState<{label:string;value:string}[]>([]),
        dispatch = useAppDispatch(),
        handleChange = (_:any,opt?:{label:string;value:string}) => {
            if (!!opt?.value) dispatch(updateAdminStaffID(opt.value))
            else dispatch(updateAdminStaffID(''))
        },
        checkAdminIdMatchStaffList = async() => {
            try {
                const 
                    rawStr = await getFiledataPromise((document.getElementById('coworkerCSVfile') as HTMLInputElement).files[0]) as string,
                    rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][],
                    ids = rows.filter((_,i)=>i > 1).map(row=>row[0].trim())
                if (!ids.includes(adminStaffID)) dispatch(updateAdminStaffID(''))
            } catch (error) {
                dispatch(updateAdminStaffID(''))
            }
        },
        updateOptions = async() => {
            try {
                const 
                    rawStr = await getFiledataPromise((document.getElementById('coworkerCSVfile') as HTMLInputElement).files[0]) as string,
                    rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][],
                    arr = rows.filter((_,i)=>i > 1).map(row=>({
                        value:row[0].trim(),
                        label:`${row[0].trim()} - ${row[1].trim()} ${row[2].trim()}`
                    }))
                setStaffList(arr)
            } catch (error) {
                setStaffList([])
            }
        }

    useEffect(()=>{
        if (step===2) {
            updateOptions()
            if (!!adminStaffID && adminStaffID.length !== 0) checkAdminIdMatchStaffList()
        }
    },[step])

    return (
        <>
        <Typography variant="h5" component="div" align='center' sx={{mt:5,mb:3}}>{stepTitle}</Typography>
        <Grid 
            container
            direction='row'
            ml={0}
            pl={2}
            pr={2}
            pt={1}
            pb={3}
            mt={3}
            sx={{boxShadow:'0px 0px 5px #ccc',borderRadius:2,width:'100%',justifyContent:'center'}}
            rowSpacing={2}
        >
            <Grid item sm={5} xs={12}>
                <Autocomplete 
                    fullWidth
                    disablePortal
                    options={staffList}
                    onChange={handleChange}
                    renderInput={(params) => <TextField {...params} label="Please select yourself" />}
                />
            </Grid>
        </Grid>
        </>
    )
}

export default SelectAdmin;