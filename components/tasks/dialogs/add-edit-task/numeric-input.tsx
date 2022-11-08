import React, { ChangeEvent, memo, useContext } from "react";
import TextField from '@mui/material/TextField';
import { editTextFieldAction } from "./reducer";
import { Context } from ".";

const NumericInput = memo((
    {
        label,
        value,
        field,
        required,
    }:{
        label:string;
        value:string;
        field:string;
        required:boolean;
    }
)=>{
    const 
        {addEditTaskDispatch} = useContext(Context),
        onChange = (e:ChangeEvent<HTMLInputElement>) => addEditTaskDispatch(editTextFieldAction({
            key:`${field}_edit`,
            value:e.target.value
        }))

    return (
        <TextField 
            required={required}
            label={label}
            inputProps={{
                inputMode: 'numeric', 
                pattern: '[0-9]+([\.][0-9]+)?'
            }}
            value={value}
            onChange={onChange}
        />
    )
})

NumericInput.displayName = 'NumericInput'
export default NumericInput