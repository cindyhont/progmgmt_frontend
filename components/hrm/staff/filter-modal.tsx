import React, { createContext, useEffect, useReducer, useRef, useState, Dispatch, useContext } from "react";
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
import { addFilterAction, filterReducer, Iactions, IhrmStaffFilterRdcr, initialState } from "./reducers/filter";
import { DialogEditContext } from ".";

export interface Icontext {
    filterDispatch: Dispatch<Iactions>
}

const 
    FilterContext = createContext<Icontext>(undefined),
    FilterModal = ({filterOn}:{filterOn:boolean})=>{
        const 
            dispatch = useAppDispatch(),
            addButton = useRef<HTMLButtonElement>(),
            filterMode = useAppSelector(state => state.hrmStaff.filterMode,shallowEqual),
            [state,filterDispatch] = useReducer(filterReducer,initialState),
            [filterEverOpened,setFilterEverOpened] = useState(false),
            {dialogEditDispatch} = useContext(DialogEditContext),
            modalOnClose = () => dialogEditDispatch({type:'filter',payload:false}),
            theme = useTheme(),
            addFilter = () => {
                filterDispatch(addFilterAction(uuidv4()))
                setTimeout(()=>addButton.current.scrollIntoView({ behavior: 'smooth' }),10)
            },
            updateFilters = () => dispatch(updateFilterAndMode({
                mode:(document.getElementsByName('staff-filter-mode')[0] as HTMLInputElement).value as 'AND'|'OR',
                filters:state.filters
            }))

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
                                <InputLabel>Mode</InputLabel>
                                <Select
                                    defaultValue={filterMode}
                                    label="Mode"
                                    name='staff-filter-mode'
                                >
                                    <MenuItem value='AND'>AND</MenuItem>
                                    <MenuItem value='OR'>OR</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <FilterContext.Provider value={{filterDispatch}}>
                        <>
                        {(state as IhrmStaffFilterRdcr).filters.map(filter=>(
                            <FilterModalRow 
                                key={filter.id} 
                                {...filter}
                            />
                        ))}
                        </>
                    </FilterContext.Provider>
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
    }

export default FilterModal
export { FilterContext }