import React, { memo } from "react";
import Grid from '@mui/material/Grid';
import TextField from "@mui/material/TextField";
import DeleteIcon from '@mui/icons-material/Delete';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import useMediaQuery from '@mui/material/useMediaQuery';
import { deleteFilterAction } from "./reducers/filter";
import { NIL as uuidNIL } from 'uuid'

const FilterModalRow = memo((
    {
        id,
        filterDispatch
    }:{
        id:string;
        filterDispatch:(value:{type:string;payload:string;})=>void;
    }
)=>{
    const 
        theme = useTheme(),
        matchesSM = useMediaQuery(theme.breakpoints.up('sm')),
        onDelete = () => filterDispatch(deleteFilterAction(id))
        
    return (
        <Grid
            container
            direction='row'
            mt={2}
            columnSpacing={1}
        >
            <Grid item sm={3} xs={12}>
                <FormControl fullWidth>
                    <InputLabel id="dept-filter-field-label">Field</InputLabel>
                    <Select
                        labelId="dept-filter-field-label"
                        id="dept-filter-field"
                        defaultValue={id===uuidNIL ? 'name' : ''}
                        name='dept-filter-field'
                        label="Field"
                    >
                        <MenuItem value='internal_id'>ID</MenuItem>
                        <MenuItem value='name'>Name</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item sm={3} xs={12} mt={matchesSM ? 0 : 1}>
                <FormControl fullWidth>
                    <InputLabel id="dept-filter-operator-label">Operator</InputLabel>
                    <Select
                        labelId="dept-filter-operator-label"
                        id="dept-filter-operator"
                        defaultValue={id===uuidNIL ? 'contains' : ''}
                        name='dept-filter-operator'
                        label="Operator"
                    >
                        <MenuItem value='contains'>contains</MenuItem>
                        <MenuItem value='equals'>equals</MenuItem>
                        <MenuItem value='start_with'>starts with</MenuItem>
                        <MenuItem value='end_with'>ends with</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item sm={5} xs={12} mt={matchesSM ? 0 : 1}>
                <TextField 
                    fullWidth 
                    name='dept-filter-value'
                    label='Value'
                />
            </Grid>
            <Grid item sm={1} xs={12} sx={{height:56,display:'flex',flexDirection:'column',justifyContent:'center'}}>
                <IconButton 
                    sx={matchesSM ? {
                        border:`1px solid ${theme.palette.primary.main}`
                    }:{
                        borderRadius:1,
                        border:`1px solid ${theme.palette.primary.main}`
                    }} 
                    color='primary'
                    onClick={onDelete}
                >
                    <DeleteIcon />
                </IconButton>
            </Grid>
        </Grid>
    )
})

FilterModalRow.displayName = 'FilterModalRow'
export default FilterModalRow