import React, { ChangeEvent, memo, useEffect, useRef, useState } from 'react';
import { shallowEqual } from "react-redux";
import { useTheme } from '@mui/material/styles';
import { staffDetailStatus } from './reducer';
import { useRouter } from 'next/router';
import Papa from 'papaparse'
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import constants from '../constants';
import Button from '@mui/material/Button';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { IstaffDetails } from '../interfaces';
import Modal from '@mui/material/Modal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CheckIcon from '@mui/icons-material/Check';
import TablePagination from '@mui/material/TablePagination';
import TableFooter from '@mui/material/TableFooter';
import { getFiledataPromise, updateSession } from '../functions';
import { useAppDispatch, useAppSelector } from '@reducers';

const 
    StaffDetails = () => {
        const
            stepTitle = useAppSelector(state=>state.startPage.steps[1],shallowEqual),
            deptFormat = useAppSelector(state=>state.startPage.deptFormat,shallowEqual),
            thisSectionOK = useAppSelector(state=>state.startPage.completed[1],shallowEqual),
            step = useAppSelector(state=>state.startPage.step,shallowEqual),
            dispatch = useAppDispatch(),
            theme = useTheme(),
            router = useRouter(),
            [errorMsg,setErrorMsg] = useState<string[]>([]),
            [modalOpen,setModalOpen] = useState(false),
            handleOpen = () => setModalOpen(true),
            fileButtonOnClick = () => document.getElementById('coworkerCSVfile').click(),
            fileNotOk = () => dispatch(staffDetailStatus(false)),
            getDeptIDs = async() => {
                if (deptFormat==='csv'){
                    try {
                        const 
                            rawStr = await getFiledataPromise((document.getElementById('deptCSVfile') as HTMLInputElement).files[0]) as string,
                            rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][]
                        return rows.map(row=>row[0].trim())
                    } catch (error) {
                        return []
                    }
                } else {
                    const idFields = document.getElementsByName('dept-manual-id') as NodeListOf<HTMLInputElement>
                    let ids:string[] = []
                    idFields.forEach(e=>ids.push(e.value))
                    return ids.map(id=>id.trim())
                }
            },
            checkCSV = async() => {
                const correctDeptIDs = await getDeptIDs();
                if (correctDeptIDs.length === 0){
                    fileNotOk()
                    return
                }

                try {
                    const 
                        rawStr = await getFiledataPromise((document.getElementById('coworkerCSVfile') as HTMLInputElement).files[0]) as string,
                        rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][],
                        len = rows.length;

                    if (len < 2){
                        fileNotOk()
                        setErrorMsg(['No content in the file.'])
                        return
                    }
                    
                    let errors:string[] = []

                    for (let j=2; j<len; j++){
                        const 
                            k = j+1,
                            row = rows[j]
                        if (row.some((i,m)=>i.trim().length === 0 && m !== 6)){
                            errors.push(`Row ${k} has empty cell(s).`)
                            continue;
                        }
                        if (row[0].trim().length ===0 || row[0].trim().length > 30) errors.push(`Row ${k}: column A (staff ID) should have 30 characters or less.`)
                        if (row[1].trim().length ===0 || row[1].trim().length > 128) errors.push(`Row ${k}: column B (first name) should have 128 characters or less.`)
                        if (row[2].trim().length ===0 || row[2].trim().length > 128) errors.push(`Row ${k}: column C (last name) should have 128 characters or less.`)
                        const email = row[3].trim()
                        if (email.length ===0 || email.length > 128) errors.push(`Row ${k}: column D (email address) should have 128 characters or less.`)
                        if (!constants.emailRegex.test(email)) errors.push(`Row ${k}: column D (email address) is not a valid email address.`)
                        if (row[4].trim().length ===0 || row[4].trim().length > 200) errors.push(`Row ${k}: column E (job title) should have 200 characters or less.`)
                        if (row[5].trim().length ===0 || row[5].trim().length > 30) errors.push(`Row ${k}: column F (department ID) should have 30 characters or less.`)
                        if (row[6].trim().length > 30) errors.push(`Row ${k}: column G (supervisor ID) should have 30 characters or less.`)
                        if (+row[7]!==0 && +row[7]!==1) errors.push(`Row ${k}: column H should be either 0 or 1.`)
                        if (+row[8]!==0 && +row[8]!==1) errors.push(`Row ${k}: column I should be either 0 or 1.`)
                        if (+row[9]!==0 && +row[9]!==1) errors.push(`Row ${k}: column J should be either 0 or 1.`)
                        if (+row[10]!==0 && +row[10]!==1) errors.push(`Row ${k}: column K should be either 0 or 1.`)
                    }

                    if (errors.length > 0){
                        setErrorMsg(errors)
                        fileNotOk()
                        return;
                    }

                    const 
                        staffIDs = rows.filter((_,i)=>i >1 ).map(r=>r[0]),
                        deptIDs = Array.from(new Set(rows.filter((_,i)=>i >1 ).map(r=>r[5].trim()))),
                        emails = Array.from(new Set(rows.filter((_,i)=>i >1 ).map(r=>r[3].trim()))),
                        supervisorIDs = Array.from(new Set(rows.filter((row,i)=>i > 1 && row[6].trim().length > 0).map(r=>r[6].trim())))

                    if (staffIDs.length !== Array.from(new Set(staffIDs)).length) errors.push('Some of staff IDs are duplicated, they should all be unique.')
                    if (emails.length !== Array.from(new Set(emails)).length) errors.push('Some of email addresses are duplicated, they should all be unique.')
                    if (deptIDs.some(id=>!correctDeptIDs.includes(id))) errors.push('There are department IDs that are not listed in step 1.')
                    if (supervisorIDs.some(id=>!staffIDs.includes(id))) errors.push("Some of supervisors' staff IDs are not found in staff IDs.")

                    if (errors.length > 0){
                        setErrorMsg(errors)
                        fileNotOk()
                        return;
                    }
                    
                    setErrorMsg([])
                    dispatch(staffDetailStatus(true))
                } catch (error) {
                    fileNotOk()
                }
            },
            onCsvUpdate = async(e:ChangeEvent<HTMLInputElement>) => {
                e.preventDefault();
                e.stopPropagation();
                updateSession(router,dispatch)

                checkCSV()
            }

        useEffect(()=>{
            if (thisSectionOK && step===1) checkCSV()
        },[step])

        return (
            <>
            <Typography variant="h5" component="div" align='center' sx={{mt:5,mb:3}}>{stepTitle}</Typography>
            <Grid 
                container
                ml={0}
                pl={2}
                pr={2}
                pt={1}
                pb={3}
                mt={3}
                sx={{boxShadow:'0px 0px 5px #ccc',borderRadius:2,width:'100%'}}
                rowSpacing={2}
            >
                <Typography paragraph align='center' sx={{mt:1,mb:0,width:'100%'}}>
                    Upload a CSV file with all coworker details.<br />
                    <a 
                        id='start-coworker-csv-template'
                        href={constants.coworkerCSVtemplate} 
                        style={{color:theme.palette.primary.main}}
                        target='_blank'
                        rel='nofollow noopener noreferrer'
                    >Get the template here.</a>
                </Typography>
                <Typography variant='subtitle2' align='center' sx={{width:'100%'}}>
                    (Please do not re-order the columns.)
                </Typography>
                <Grid item xs={12} container direction='column' style={{justifyContent:'space-evenly'}}>
                    <input type="file" accept='.csv' onChange={onCsvUpdate} id='coworkerCSVfile' style={{display:'none'}} />
                    <Button 
                        variant="contained" 
                        startIcon={<UploadFileIcon />} 
                        onClick={fileButtonOnClick} 
                        sx={{margin:'auto',mt:2,mb:2,width:'100%',maxWidth:240}}
                    >
                        Select csv file
                    </Button>
                    {thisSectionOK && 
                        <>
                        <Button 
                            variant="outlined" 
                            startIcon={<FormatListBulletedIcon />} 
                            sx={{margin:'auto',mt:2,mb:2,width:'100%',maxWidth:240}} 
                            onClick={handleOpen}
                        >
                            file content
                        </Button>
                        <Typography sx={{color:theme.palette.mode==='dark' ? 'lightgreen' : 'green'}} align='center'>File OK.</Typography>
                        <ListModal {...{modalOpen,setModalOpen}} />
                        </>
                    }
                </Grid>
                {errorMsg.length > 0 && <Grid item xs={12} container direction='row' style={{justifyContent:'center',color:theme.palette.error.main}}>
                    <ul>
                        {errorMsg.map((i,j)=>(<li key={j}>{i}</li>))}
                    </ul>
                </Grid>}
            </Grid>
            </>
        )
    },
    ListModal = (
        {
            modalOpen,
            setModalOpen,
        }:{
            modalOpen:boolean;
            setModalOpen:(value:boolean)=>void;
        }
    ) => {
        const 
            rowsPerPageOptions = useRef([5,10, 20, 50]).current,
            [staffDetails,setStaffDetails] = useState<IstaffDetails[]>([]),
            [page, setPage] = useState(0),
            [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]),
            handleClose = () => setModalOpen(false),
            handleChangePage = (_:any,newPage: number) => setPage(newPage),
            handleChangeRowsPerPage = (e:any) => {
                setRowsPerPage(+e.target.value);
                setPage(0);
            },
            updateContent = async(p:number) => {
                try {
                    const 
                        rawStr = await getFiledataPromise((document.getElementById('coworkerCSVfile') as HTMLInputElement).files[0]) as string,
                        rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][],
                        arr:IstaffDetails[] = rows.filter((_,i)=>i > 1).slice(p*rowsPerPage,(p+1)*rowsPerPage).map(row=>({
                            id:row[0].trim(),
                            fn:row[1].trim(),
                            ln:row[2].trim(),
                            e:row[3].trim(),
                            t:row[4].trim(),
                            d:row[5].trim(),
                            s:row[6].trim().length > 0 ? row[6].trim() : null,
                            ur:Array.from(Array(4).keys(),i=>(+row[i+7]) * Math.pow(2,i)).reduce((a,b)=>a+b)
                        }))
                        setStaffDetails(arr)
                } catch (error) {
                    setStaffDetails([])
                }
            }

        useEffect(()=>{
            if (modalOpen) updateContent(page)
            else setStaffDetails([])
        },[page,rowsPerPage,modalOpen])

        return (
            <Modal
                keepMounted
                open={modalOpen}
                onClose={handleClose}
                sx={{
                    display:'flex',
                    flexDirection:'column'
                }}
            >
                <TableContainer 
                    component={Paper}
                    sx={{
                        margin:'auto',
                        width:'80vw',
                        maxHeight:'80vh',
                    }}
                >
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Staff ID</TableCell>
                                <TableCell>First Name</TableCell>
                                <TableCell>Last Name</TableCell>
                                <TableCell>Email Address</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell>{"Supervisor's ID"}</TableCell>
                                <TableCell align='center'>Department</TableCell>
                                <TableCell align='center'>Create / edit / delete staff</TableCell>
                                <TableCell align='center'>View Staff</TableCell>
                                <TableCell align='center'>Create / edit / delete projects</TableCell>
                                <TableCell align='center'>Assign tasks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {staffDetails.map((row)=>(
                                <TableRow key={row.id}>
                                    <TableCell>{row.id}</TableCell>
                                    <TableCell>{row.fn}</TableCell>
                                    <TableCell>{row.ln}</TableCell>
                                    <TableCell>{row.e}</TableCell>
                                    <TableCell>{row.t}</TableCell>
                                    <TableCell>{row.s}</TableCell>
                                    <TableCell align='center'>{row.d}</TableCell>
                                    <TableCell align='center'>{(row.ur & 1) !== 0 && <CheckIcon />}</TableCell>
                                    <TableCell align='center'>{(row.ur & 2) !== 0 && <CheckIcon />}</TableCell>
                                    <TableCell align='center'>{(row.ur & 4) !== 0 && <CheckIcon />}</TableCell>
                                    <TableCell align='center'>{(row.ur & 8) !== 0 && <CheckIcon />}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={rowsPerPageOptions}
                                    count={staffDetails.length}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Modal>
        )
    }

export default StaffDetails;