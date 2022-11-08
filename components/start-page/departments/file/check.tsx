import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

import Button from '@mui/material/Button';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';

import Modal from '@mui/material/Modal';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableFooter from '@mui/material/TableFooter';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Papa from 'papaparse'
import { Idept } from '../../../interfaces';
import { getFiledataPromise } from '../../../functions';

const DeptFileChecker = () => {
    const 
        rowsPerPageOptions = useRef([5,10, 20, 50]).current,
        [deptFileArr,setDeptFileArr] = useState<Idept[]>([]),
        [deptFileLen,setDeptFileLen] = useState(0),
        [page,setPage] = useState(0),
        [rowsPerPage,setRowsPerPage] = useState(rowsPerPageOptions[0]),
        [modalOpen,setModalOpen] = useState(false),
        handleOpen = () => {
            setModalOpen(true)
            setPage(0)
        },
        getFileContent = async (p:number) => {
            try {
                const 
                    rawStr = await getFiledataPromise((document.getElementById('deptCSVfile') as HTMLInputElement).files[0]) as string,
                    rows = Papa.parse(rawStr,{skipEmptyLines:true}).data as string[][]
                if (rows.length !== deptFileLen) setDeptFileLen(rows.length)
                setDeptFileArr(rows.slice(p * rowsPerPage, (p+1) * rowsPerPage).map(row=>({i:row[0].trim(),n:row[1].trim()})))
            } catch (error) {
                setDeptFileLen(0)
                setDeptFileArr([])
            }
        },
        handleClose = () => setModalOpen(false),
        handleChangePage = (_e:any,newPage:number) => setPage(newPage),
        handleChangeRowsPerPage = (e: ChangeEvent<HTMLInputElement>) => {
            setRowsPerPage(+e.target.value)
            setPage(0)
        }

    useEffect(()=>{
        if (modalOpen) getFileContent(page)
        else setDeptFileArr([])
    },[page,rowsPerPage,modalOpen])

    return (
        <>
            <Button 
                variant="outlined" 
                startIcon={<FormatListBulletedIcon />} 
                sx={{margin:'auto',mt:2,mb:2,width:'100%',maxWidth:240}} 
                onClick={handleOpen}
            >
                file content
            </Button>
            <Typography sx={{color:'green'}} align='center'>File OK.</Typography>
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
                        maxWidth:'600px',
                        width:'90vw',
                        maxHeight:'80vh'
                    }}
                >
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Department ID</TableCell>
                                <TableCell>Department Name</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deptFileArr.map(({i,n})=>(
                                <TableRow key={i}>
                                    <TableCell>{i}</TableCell>
                                    <TableCell>{n}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={rowsPerPageOptions}
                                    count={deptFileLen}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    showFirstButton
                                    showLastButton
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </TableContainer>
            </Modal>
        </>
    )
}

export default DeptFileChecker