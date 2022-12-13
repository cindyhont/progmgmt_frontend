import React, { memo, useContext, useEffect, useReducer, useRef, useState } from "react";
import {v4 as uuidv4} from 'uuid'
import { grey } from '@mui/material/colors';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Modal from '@mui/material/Modal';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import { useAppDispatch, useAppSelector } from "@reducers";
import { shallowEqual } from "react-redux";
import FilterModalRow from "./filter-row";
import { updateFilterAndMode } from "./reducers/slice";
import { addFilterAction, filterReducer, initialState } from "./reducers/filter";
import { ThrmDeptColumn, ThrmDeptFilterOperators } from "../interfaces";
import { DialogEditContext } from ".";

const FilterModal = memo(({filterOn}:{filterOn:boolean})=>{
    const 
        dispatch = useAppDispatch(),
        addButton = useRef<HTMLButtonElement>(),
        filterMode = useAppSelector(state => state.hrmDept.filterMode,shallowEqual),
        [state,filterDispatch] = useReducer(filterReducer,initialState),
        [filterEverOpened,setFilterEverOpened] = useState(false),
        {dialogEditDispatch} = useContext(DialogEditContext),
        modalOnClose = () => dialogEditDispatch({type:'filter',payload:false}),
        theme = useTheme(),
        addFilter = () => {
            filterDispatch(addFilterAction(uuidv4()))
            setTimeout(()=>addButton.current.scrollIntoView({ behavior: 'smooth' }),10)
        },
        updateFilters = () => {
            const 
                modeElem = document.getElementsByName('dept-filter-mode') as NodeListOf<HTMLInputElement>,
                mode = modeElem[0].value as "AND" | "OR",
                fieldElems = document.getElementsByName('dept-filter-field') as NodeListOf<HTMLInputElement>,
                operatorElems = document.getElementsByName('dept-filter-operator') as NodeListOf<HTMLInputElement>,
                valueElems = document.getElementsByName('dept-filter-value') as NodeListOf<HTMLInputElement>

            let 
                fields:(ThrmDeptColumn)[] = [], 
                operators:("" | ThrmDeptFilterOperators)[] = [], 
                values:string[] = []

            fieldElems.forEach(e=>fields.push(e.value as ThrmDeptColumn))
            operatorElems.forEach(e=>operators.push(e.value as "" | ThrmDeptFilterOperators))
            valueElems.forEach(e=>values.push(e.value))

            dispatch(updateFilterAndMode({mode,fields,operators,values}))
        }

    useEffect(()=>{
        if (filterOn) setFilterEverOpened(true)
        else if (filterEverOpened) updateFilters()
    },[filterOn])

    return (
        <Modal
            keepMounted
            open={filterOn}
            onClose={modalOnClose}
        >
            <Grid 
                container 
                p={2}
                direction='column'
                sx={{
                    position:'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    maxWidth:'600px',
                    maxHeight:'400px',
                    width:'90vw',
                    height:'90vh',
                    backgroundColor:theme.palette.mode==='dark' ? grey[900] : '#fff',
                    flexWrap:'nowrap',
                    overflowY:'scroll',
                }}
            >
                <Grid container direction='row' columnSpacing={1}>
                    <Grid 
                        item 
                        sm={3}
                        xs={6}
                    >
                        <FormControl fullWidth>
                            <InputLabel id="dept-filter-mode-label">Mode</InputLabel>
                            <Select
                                defaultValue={filterMode}
                                labelId="dept-filter-mode-label"
                                id="dept-filter-mode"
                                label="Mode"
                                name='dept-filter-mode'
                            >
                                <MenuItem value='AND'>AND</MenuItem>
                                <MenuItem value='OR'>OR</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {state.ids.map(id=>(
                    <FilterModalRow 
                        key={id} 
                        {...{
                            id,
                            filterDispatch
                        }}
                    />
                ))}
                <Button 
                    ref={addButton} 
                    fullWidth 
                    variant="outlined" 
                    endIcon={<AddIcon />} 
                    sx={{mt:2}} 
                    onClick={addFilter}
                >
                    Add
                </Button>
            </Grid>
        </Modal>
    )
})

FilterModal.displayName = 'FilterModal'
export default FilterModal