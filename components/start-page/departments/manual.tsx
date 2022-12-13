import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import { shallowEqual } from 'react-redux';
import { deptManualStatus } from '../reducer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAppDispatch, useAppSelector } from '@reducers';
import {v4 as uuidv4} from 'uuid'

const 
    DeptManual = memo(() => {
        const 
            theme = useTheme(),
            matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
            dispatch = useAppDispatch(),
            deptFormat = useAppSelector(state=>state.startPage.deptFormat,shallowEqual),
            [rowIDs,setRowIDs] = useState<string[]>([uuidv4()]),
            handleChange = useCallback(() => {
                const 
                    idFields = document.getElementsByName('dept-manual-id') as NodeListOf<HTMLInputElement>,
                    nameFields = document.getElementsByName('dept-manual-name') as NodeListOf<HTMLInputElement>

                let ids:string[] = [], names:string[] = []
                
                idFields.forEach(e=>ids.push(e.value))
                nameFields.forEach(e=>names.push(e.value))

                const ok = Array.from(new Set(ids.filter(id=>id!=='').map(id=>id.toLowerCase().trim()))).length === rowIDs.length && names.filter(n=>n.trim()!=='').length === rowIDs.length
                dispatch(deptManualStatus(ok))
            },[rowIDs.length]),
            bottomRef = useRef<HTMLDivElement>(),
            addInput = () => {
                setRowIDs(prev=>([...prev,uuidv4()]))
                bottomRef.current.scrollIntoView()
            },
            handleDelete = (id:string) => setRowIDs(prev=>prev.filter(e=>e!==id))
        
        return (
            <Grid container rowSpacing={matchesSM ? 2 : 4} sx={{mt:2,display:deptFormat==='manual' ? 'block' : 'none'}}>
                {rowIDs.map(id=>(
                    <Row 
                        {...{
                            id,
                            handleChange,
                            handleDelete:()=>handleDelete(id)
                        }}
                        key={id}
                    />
                ))}
                <Button fullWidth variant="outlined" endIcon={<AddIcon />} sx={{mt:3}} onClick={addInput}>
                    Add
                </Button>
                <div ref={bottomRef} />
            </Grid>
        )
    }),
    Row = memo((
        {
            id,
            handleChange,
            handleDelete
        }:{
            id:string;
            handleChange:()=>void;
            handleDelete:()=>void
        }
    )=>{
        const theme = useTheme()
        return (
            <Grid container key={id} direction='row' item columnSpacing={2} rowSpacing={1}>
                <Grid item sm={3} xs={12}>
                    <TextField
                        required
                        fullWidth
                        label='Department ID'
                        name='dept-manual-id'
                        inputProps={{
                            minLength:1,
                            maxLength:30
                        }}
                        onChange={handleChange}
                    ></TextField>
                </Grid>
                <Grid item md={8} sm={7} xs={12}>
                    <TextField
                        required
                        fullWidth
                        label='Department Name'
                        name='dept-manual-name'
                        inputProps={{
                            minLength:1,
                            maxLength:200
                        }}
                        // value={n}
                        onChange={handleChange}
                    ></TextField>
                </Grid>
                <Grid item md={1} sm={2} xs={12} >
                    <IconButton 
                        size="large" 
                        color='secondary'
                        sx={{
                            borderRadius:1,
                            border:`1px solid ${theme.palette.mode === 'light'
                                ? theme.palette.grey[400]
                                : theme.palette.grey[700]}`,
                            width: '100%',
                            height:'56px',
                            ['&:hover']:{
                                border:`1px solid ${theme.palette.mode === 'light'
                                ? theme.palette.grey[900]
                                : theme.palette.grey[100]}`,
                            },
                        }} 
                        onClick={handleDelete}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>
        )
    })
DeptManual.displayName = 'DeptManual'
Row.displayName = 'Row'
export default DeptManual;