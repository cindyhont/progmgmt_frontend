import React, { ChangeEvent, memo, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { shallowEqual } from "react-redux";
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Papa from 'papaparse'
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeptFileChecker from './check';
import { Idept } from '../../../interfaces';
import { deptFileStatus } from '../../reducer';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { getFiledataPromise, updateSession } from '../../../functions';
import { useAppDispatch, useAppSelector } from '@reducers';

const DeptFileUploader = () => {
    const
        theme = useTheme(),
        router = useRouter(),
        matchesMD = useMediaQuery(theme.breakpoints.up('md')),
        fileButtonOnClick = () => document.getElementById('deptCSVfile').click(),
        dispatch = useAppDispatch(),
        deptFileOK = useAppSelector(state=>state.startPage.deptFileOK,shallowEqual),
        deptFormat = useAppSelector(state=>state.startPage.deptFormat,shallowEqual),
        [firstUpload,setFirstUpload] = useState(false),
        fileNotOk = () => dispatch(deptFileStatus(false)),
        checkCSV = async(e:ChangeEvent<HTMLInputElement>) => {
            e.preventDefault();
            e.stopPropagation();
            updateSession(router,dispatch)

            try {
                const 
                    rawStr = await getFiledataPromise(e.target.files[0]) as string,
                    rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][],
                    len = rows.length;

                setFirstUpload(true)

                let arr:Idept[] = []

                for (let j=0; j<len; j++){
                    const row = rows[j];
                    if (row.length !== 2){
                        fileNotOk()
                        return
                    }
                    const 
                        i = row[0].trim(),
                        n = row[1].trim()
                    if (i.length === 0 || i.length > 30 || n.length === 0 || n.length > 200){
                        fileNotOk()
                        return
                    }
                    arr.push({i,n})
                }
                // check if ids are unique
                const ids = Array.from(new Set(arr.map(({i})=>i)));
                if (ids.length === arr.length) dispatch(deptFileStatus(true))
                else fileNotOk()
            } catch (error) {
                fileNotOk()
            }
        }

    return (
        <Grid container /*spacing={2}*/ sx={{display:deptFormat==='csv' ? 'flex' : 'none'}}>
            <Grid item md={deptFileOK ? 12 : 3} sm={12} mt={matchesMD && !deptFileOK ? 0 : 2} container direction='column' style={{justifyContent:'space-evenly'}}>
                <input type="file" accept='.csv' onChange={checkCSV} id='deptCSVfile' style={{display:'none'}} />
                <Button 
                    variant="contained" 
                    startIcon={<UploadFileIcon />} 
                    onClick={fileButtonOnClick} 
                    sx={{
                        mt:matchesMD ? 0 : 2,
                        mb:deptFileOK ? 0 : matchesMD ? 0 :2,
                        ...(deptFileOK && {width:'100%',maxWidth:240}),
                        margin:'auto',
                    }}
                >
                    Select csv file
                </Button>
                {!deptFileOK && firstUpload && <Typography sx={{color:'red'}}>File content error. Please check again or input manually.</Typography>}
                {deptFileOK && <DeptFileChecker />}
            </Grid>
            <Grid item md={9} sm={12} sx={{display:deptFileOK ? 'none' : 'block'}}>
                <Divider sx={{
                    display:matchesMD ? 'none' : 'block',
                    mt:3,
                    borderColor:theme.palette.mode === 'light'
                            ? theme.palette.grey[400]
                            : theme.palette.grey[500]}} />
                <ul>
                    <li>
                        Please include 2 columns in the file:
                        <ol>
                            <li>Column A - department ID (maximum 30 characters), all IDs should be unique.</li>
                            <li>Column B - department name (maximum 200 characters).</li>
                        </ol>
                    </li>
                    <li>
                        Do not put header at the top.
                    </li>
                </ul>
            </Grid>
        </Grid>
    )
}

export default DeptFileUploader;